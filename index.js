const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const BASE_API = 'https://youtube.googleapis.com/youtube/v3';
const KEY = 'AIzaSyCTmq_2rYz3nvlBy4wHTyWrQ9HIwpA21IA';

app.use(express.json());

async function getComments(videoId, maxResults) {
    try {
        const response = await axios.get(BASE_API + '/commentThreads', { params : { videoId: `${videoId}`,
                                                                                    maxResults: `${maxResults}`,
                                                                                    part: 'snippet,replies',
                                                                                    key: KEY } });
        return response.data;
    } catch (error) {
        console.log("Error while making an HTTP GET call to retrieve all comments, in getComments().", error);
    }
}

async function getCommentReplies(parentId) {
    try {
        const response = await axios.get(BASE_API + '/comments', { params : { parentId: `${parentId}`,
                                                                              part: 'snippet',
                                                                              key: KEY } });
        return response.data;
    }
    catch (error) {
        console.log("Error while making an HTTP GET call to retrieve all replies of a comments, in getCommentReplies().", error);
    }
}

async function addReplies(id) {
    try {
        const replies = [];
        const commentRepliesData = await getCommentReplies(id);
    
        commentRepliesData.items.forEach((reply) => {
            replies.push(reply.snippet.textOriginal);
        });
            
        return replies;
    }
    catch (error) {
        console.log("Error while adding replies to a comment, in addReplies().", error);
    }
}

async function processComment(comment) {
    try {
        const commentText =  comment.snippet.topLevelComment.snippet.textOriginal;
        const numOfCommentReplies =  comment.snippet.totalReplyCount;
        let commentReplies = [];
        
        if (numOfCommentReplies > 0) {
            commentReplies = await addReplies(comment.id);
        }
    
        return {text: commentText, replies: commentReplies};
    }
    catch (error) {
        console.log("Error while processing a comment, in processComment().", error);
    }
}

app.get('/comments', async (request, response) => {

    const videoId = request.query.videoId;
    const maxResults = request.query.maxResults;
    let numOfComments = 0;

    const commentsData = await getComments(videoId, maxResults);

    const allComments = {
        videoId: `${videoId}`,
        maxResults: `${maxResults}`,
        numOfComments: 0,
        comments: []
    };

    for (const comment of commentsData.items) {
        const commentRes = await processComment(comment);
        allComments['comments'].push(commentRes);
        numOfComments += 1 + comment.snippet.totalReplyCount;
    }

    allComments.numOfComments = numOfComments;

    if (!commentsData) {
        response.status(200).end("Comments not found.");
    }
    else {
        response.status(200).end(JSON.stringify(allComments));
    }
});

app.listen(port, () => console.log(`Express server currently running on port ${port}. Server started! At http://localhost:${port}`));