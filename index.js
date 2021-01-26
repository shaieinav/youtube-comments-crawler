const express = require('express');
const axios = require('axios');

const app = express();

const PORT = 3000;
const BASE_API = 'https://youtube.googleapis.com/youtube/v3';
const KEY = 'AIzaSyCTmq_2rYz3nvlBy4wHTyWrQ9HIwpA21IA';

app.use(express.json());

// HTTP GET request to fetch the maximum results of comments
async function getComments(videoId, maxResults) {
    try {
        const response = await axios.get(BASE_API + '/commentThreads', { params : { videoId: `${videoId}`,
                                                                                    maxResults: `${maxResults}`,
                                                                                    part: 'snippet',
                                                                                    key: KEY } });
        return response.data;
    }
    catch (error) {
        console.log("Error while making an HTTP GET call to retrieve all comments, in getComments().\n", error);
    }
}

// HTTP GET request to fetch the maximum results of comment replies
async function getCommentReplies(parentId, maxResults) {
    try {
        const response = await axios.get(BASE_API + '/comments', { params : { parentId: `${parentId}`,
                                                                              maxResults: `${maxResults}`,
                                                                              part: 'snippet',
                                                                              key: KEY } });
        return response.data;
    }
    catch (error) {
        console.log("Error while making an HTTP GET call to retrieve all replies of a comments, in getCommentReplies().\n", error);
    }
}

// adding maximum number of replies to a comment
async function addReplies(id, maxResults) {
    try {
        const replies = [];
        const commentRepliesData = await getCommentReplies(id, maxResults);
    
        commentRepliesData.items.forEach((reply) => {
            replies.push(reply.snippet.textOriginal);
        });
            
        return replies;
    }
    catch (error) {
        console.log("Error while adding replies to a comment, in addReplies().\n", error);
    }
}

// processing and returning a comment and its replies, if exist
async function processComment(comment, totalNumOfComments, numOfReplies, maxResults) {
    try {
        const commentText =  comment.snippet.topLevelComment.snippet.textOriginal;
        const numOfCommentReplies =  comment.snippet.totalReplyCount;
        const maxResultsOfReplies = Math.min(numOfCommentReplies, maxResults - totalNumOfComments - 1);
        let commentReplies = [];
        
        // only add replies if we have space
        if (numOfCommentReplies > 0 && maxResultsOfReplies > 0) { 
            commentReplies = await addReplies(comment.id, maxResultsOfReplies);
        }
        
        // update the count of comments and replies
        totalNumOfComments += 1 + maxResultsOfReplies;
        numOfReplies += maxResultsOfReplies;
    
        return [{text: commentText, replies: commentReplies}, totalNumOfComments, numOfReplies];
    }
    catch (error) {
        console.log("Error while processing a comment, in processComment().\n", error);
    }
}

app.get('/comments', async (request, response) => {
    try {
        // make video id and maximum result a requiered query parameter
        const videoId = request.query.videoId;
        const maxResults = request.query.maxResults;

        let totalNumOfComments = 0, numOfReplies = 0, commentRes = {};
    
        // object to hold all necessary comments data to send to the endpoint
        const allComments = {
            videoId: `${videoId}`,
            maxResults: `${maxResults}`,
            numOfComments: 0,
            numOfReplies: 0,
            totalNumOfComments: 0,
            comments: []
        };


            // get the maximum number of comments from the specified video
            const commentsData = await getComments(videoId, maxResults);
        
            // for every comment, process it and push it to the comments object
            for (const comment of commentsData.items) {
                if (totalNumOfComments < maxResults) {
                    [commentRes, totalNumOfComments, numOfReplies] = await processComment(comment, totalNumOfComments, numOfReplies, maxResults);
                    allComments['comments'].push(commentRes);
                }
            }
    
        // update count of comments and replies
        allComments.numOfComments = totalNumOfComments - numOfReplies;
        allComments.numOfReplies = numOfReplies;
        allComments.totalNumOfComments = totalNumOfComments;

        response.status(200).end(JSON.stringify(allComments));
    }
    catch (error) {
        response.status(404).end("Page Not Found!");
        console.log(`Error while rendering comments json data at http://localhost:${PORT}, in app.get('/comments', async (request, response).\n`, error);
    }
});

app.listen(PORT, () => console.log(`Express server currently running on port ${PORT}. Server started! At http://localhost:${PORT}`));