const Reddit = require('reddit')
const { WebClient, LogLevel } = require("@slack/web-api")
const fs = require('fs')

const env = JSON.parse(fs.readFileSync('./environment.json'))
const postHistory = fs.readFileSync('./postHistory.txt', 'utf-8').split(/\r?\n/).filter(item => !!item)

const reddit = new Reddit({
    username: env.redditUsername,
    password: env.redditPassword,
    appId: env.redditAppId,
    appSecret: env.redditSecret,
    userAgent: 'MyApp/1.0.0 (http://localhost)'
})

const client = new WebClient(env.slackOAuthToken, {
    logLevel: LogLevel.DEBUG
})


async function getPost() {
    const response = await reddit.get('/r/AmItheAsshole')
    let postToJudge = null

    for (let i = 0; i < response?.data?.children?.length; i++) {
        const currPost = response?.data?.children?.[i]?.data
        // find one that isnt stickied because those arent actual posts
        if (!currPost?.stickied) {
            // check if we've already seen this one
            if (!postHistory.includes(currPost.url)) {
                postToJudge = currPost
                fs.appendFileSync('./postHistory.txt', `${currPost.url}\n`)
                break
            }
        }
    }

    console.log('postToJudge', postToJudge.title)

    try {
        // Call the chat.postMessage method using the WebClient
        const result = await client.chat.postMessage({
          channel: env.channelId,
          text: `*Hello ${env.slackName} users. Is this guy an asshole?* Vote with :thumbs_up: or :thumbs:down:\n _${postToJudge.title}_`
        })
        const chat = client.conversations.history({ oldest: result.ts, channel: env.channelId, inclusive: true, limit: 1 })

        // console.log(result)
        console.log(chat)
      }
      catch (error) {
        console.error(error)
      }

}


// if ()

getPost()