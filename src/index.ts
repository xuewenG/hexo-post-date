import { execSync } from 'child_process'
import { parse } from 'hexo-front-matter'
import moment from 'moment'
import path from 'path'

const getCommitTimestampList = (filePath: string) => {
  try {
    return execSync(`git log --follow --format="%s  %at" -- ${filePath}`)
      .toString()
      .split('\n')
      .filter(line => !!line && !line.includes('ignore-commit-date'))
      .map(line => {
        const result = /  (\d*)$/.exec(line)
        if (!result || result.length < 2) {
          return 0
        }
        return parseInt(result[1])
      })
      .filter(timestamp => !!timestamp)
      .map(timestamp => {
        if (timestamp.toString().length !== 13) {
          return timestamp * 1000
        }
        return timestamp
      })
  } catch (err) {
    return []
  }
}

hexo.extend.filter.register('before_post_render', data => {
  const filePath = path.normalize(data.full_source)
  const timestampList = getCommitTimestampList(filePath)

  if (timestampList.length) {
    const frontMatter = parse(data.raw, {})

    if (!frontMatter.date) {
      const firstTimestamp = timestampList[timestampList.length - 1]
      data.date = moment(firstTimestamp)
    }

    if (!frontMatter.updated) {
      const lastTimestamp = timestampList[0]
      data.updated = moment(lastTimestamp)
    }
  }
})
