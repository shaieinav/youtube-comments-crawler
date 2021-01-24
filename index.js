const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const BASE_API = 'https://youtube.googleapis.com/youtube/v3/commentThreads';
const KEY = 'AIzaSyCTmq_2rYz3nvlBy4wHTyWrQ9HIwpA21IA';

app.use(express.json());

async function getComments(videoId, maxResults) {
    const response = await axios.get(BASE_API, { params : { videoId: `${videoId}`,
                                                            maxResults: `${maxResults}`,
                                                            part: 'snippet,replies',
                                                            key: KEY } });
    return response.data;
}

app.get('/comments', async (request, response) => {

    let videoId = request.query.videoId;
    let maxResults = request.query.maxResults;

    let commentsData = await getComments(videoId, maxResults);

    let actualComments = {
        videoId: `${videoId}`,
        maxResults: `${maxResults}`,
        comments: [
            {
                text: '',
                replies: []
            } 
        ]
    };

    commentsData.items.forEach((comment) => {
        let commentText = comment.snippet.topLevelComment.snippet.textOriginal;
        let numOfCommentReplies = comment.snippet.totalReplyCount;
        let commentReplies = [];

        if (numOfCommentReplies > 0) {
            comment.replies.comments.forEach((reply) => {
                commentReplies.push(reply.snippet.textOriginal);
            });
        }

        actualComments['comments'].push({text: commentText, replies: commentReplies});
    });

    if (!commentsData) {
        response.end("Comments not found.");
    }
    else {
        // response.status(200).end(JSON.stringify(commentsData));
        response.status(200).end(JSON.stringify(actualComments));
    }
});

app.listen(port, () => console.log(`Express server currently running on port ${port}`));

console.log(`Server started! At http://localhost:${port}`)