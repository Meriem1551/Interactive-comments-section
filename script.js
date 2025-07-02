const commentContainer = document.querySelector('.comments');
const url = './data.json';
const form = document.querySelector('.form');
let id = 6;
const comments = [];
let currentUser = {};
let replies = [];

const updateId = () => id++;

const fetchReplies = (comments) => {
  replies = [];
  comments.forEach(comment => {
    replies.push({
      id: comment.id,
      replies: comment.replies
    });
  });
};

const fetchData = async () => {
  try {
    const savedComments = localStorage.getItem('comments');
    const savedReplies = localStorage.getItem('replies');
    const savedUser = localStorage.getItem('currentUser');

    if (savedComments && savedReplies && savedUser) {
      comments.push(...JSON.parse(savedComments));
      replies = JSON.parse(savedReplies);
      currentUser = JSON.parse(savedUser);
    } else {
      const res = await fetch(url);
      const data = await res.json();
      currentUser = data.currentUser;
      data.comments.forEach(comment => comments.push(comment));
      fetchReplies(comments);
      localStorage.setItem('comments', JSON.stringify(comments));
      localStorage.setItem('replies', JSON.stringify(replies));
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  } catch (err) {
    commentContainer.innerHTML = '<p>Error loading comments. Please try again later.</p>';
    console.error('Error fetching comments:', err);
  }
};

const changeCounter = (e) => {
  const countElement = e.target.parentElement.querySelector('.countLike');
  let count = Number(countElement.textContent);
  if (e.target.className.includes('minus')) {
    if (count > 0) count--;
  } else if (e.target.className.includes('plus')) {
    count++;
  }
  countElement.textContent = count;
};

const addReply = (e) => {
  const id = Number(e.target.id.split('-')[1]);

  let parentComment = null;
  let replyingTo = '';
  let repliesContainer = null;

  parentComment = comments.find(c => c.id === id);
  if (parentComment) {
    replyingTo = parentComment.user.username;
    repliesContainer = document.getElementById(`replies-${id}`);
  } else {
    for (const comment of comments) {
      const reply = comment.replies.find(r => r.id === id);
      if (reply) {
        parentComment = comment;
        replyingTo = reply.user.username;
        repliesContainer = document.getElementById(`replies-${comment.id}`);
        break;
      }
    }
  }

  if (!parentComment || !repliesContainer) {
    console.error("Parent comment or reply container not found");
    return;
  }

  const replyForm = document.createElement('div');
  replyForm.className = 'form';
  replyForm.innerHTML = `
    <img class="userImage" src="${currentUser.image.png}" alt="user Image">
    <textarea class="commentInput" placeholder="Reply to @${replyingTo}"></textarea>
    <button class="sendButton" type="submit">Reply</button>
  `;

  repliesContainer.appendChild(replyForm);

  replyForm.querySelector('.sendButton').addEventListener('click', (e) => {
    e.preventDefault();
    const content = replyForm.querySelector('.commentInput').value.trim();
    if (!content) {
      alert('Please enter a reply.');
      return;
    }

    const newReply = {
      id: updateId(),
      content: content,
      createdAt: new Date().toLocaleDateString(),
      score: 0,
      replyingTo: replyingTo,
      user: currentUser,
    };

    parentComment.replies.push(newReply);
    fetchReplies(comments);
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('replies', JSON.stringify(replies));
    replyForm.remove();
    displayReplies();
  });
};


const editComment = (e) => {
  const id = Number(e.target.id.split('-')[1]);
  const commentElement = document.getElementById(`comment-${id}`) || document.getElementById(`reply-${id}`);
  const commentText = commentElement.querySelector('.commentText').textContent.trim();
  const commentSectionContent = commentElement.querySelector('.commentSectionContent');
  const editForm = document.createElement('div');
  editForm.className = 'form';
  editForm.innerHTML = `
    <img class="userImage" src="${currentUser.image.png}" alt="user Image">
    <textarea class="commentInput">${commentText}</textarea>
    <button class="sendButton" type="submit">Update</button>
  `;
  commentSectionContent.innerHTML = '';
  commentSectionContent.appendChild(editForm);
  editForm.querySelector('.sendButton').addEventListener('click', (e) => {
    e.preventDefault();
    const updatedContent = editForm.querySelector('.commentInput').value.trim();
    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex !== -1) {
      comments[commentIndex].content = updatedContent;
    } else {
      for (const comment of comments) {
        const replyIndex = comment.replies.findIndex(r => r.id === id);
        if (replyIndex !== -1) {
          comment.replies[replyIndex].content = updatedContent;
          fetchReplies(comments);
          break;
        }
      }
    }

    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('replies', JSON.stringify(replies));
    displayComments();
    displayReplies();
  });
}

const deleteComment = (e) => {
  const id = Number(e.target.id.split('-')[1]);
  const confimContainer = document.getElementById('delete-confirmation');
  const div = document.querySelector('.overlay');
  confimContainer.classList.remove('hidden');
  div.classList.remove('hidden');
  //Cancel the delete
  confimContainer.querySelector('.cancel').addEventListener('click', () => {
    confimContainer.classList.add('hidden');
    div.classList.add('hidden');
  });
  //confirm the delete
 confimContainer.querySelector('.delete').addEventListener('click', () => {

    const commentIndex = comments.findIndex(c => c.id === id);
    if (commentIndex !== -1) {
      comments.splice(commentIndex, 1);
    }

    else {
      for (const comment of comments) {
        const replyIndex = comment.replies.findIndex(r => r.id === id);
        if (replyIndex !== -1) {
          comment.replies.splice(replyIndex, 1);
          fetchReplies(comments);
          break;
        }
      }
    }
    localStorage.setItem('comments', JSON.stringify(comments));
    localStorage.setItem('replies', JSON.stringify(replies));
    confimContainer.classList.add('hidden');
    div.classList.add('hidden');
    displayComments();
    displayReplies();
});
  }

const addComment = (e) => {
  e.preventDefault();
  const form = document.querySelector('.form');
  const commentInput = form.querySelector('.commentInput');
  const content = commentInput.value.trim();
  const sendBtn = form.querySelector('.sendButton');
  if (!content) {
    alert('Please enter a comment.');
    return;
  }
  const nexComment = {
    id: updateId(),
    content: content,
    createdAt: new Date().toLocaleDateString(),
    score: 0,
    user: currentUser,
    replies: []
  };
  comments.push(nexComment);
  fetchReplies(comments);
  localStorage.setItem('comments', JSON.stringify(comments));
  localStorage.setItem('replies', JSON.stringify(replies));
  commentInput.value = '';
  displayComments();
  displayReplies();
}


const displayComments = () => {
  commentContainer.innerHTML = ''; 
  comments.forEach(comment => {
    commentContainer.innerHTML += `
      <div class="comment" id="comment-${comment.id}">
        <div class="likeCounter">
          <img src="./images/icon-plus.svg" alt="plus" id="plus-${comment.id}" onclick="changeCounter(event)" class="plus">
          <span class="countLike" id="count-${comment.id}">${comment.score}</span>
          <img src="./images/icon-minus.svg" alt="minus" id="minus-${comment.id}" class="minus" onclick="changeCounter(event)">
        </div>
        <div class="commentSection">
          <div class="commentSectionHeader">
            <img src="${comment.user.image.png}" alt="user image" class="userImage">
            <p><span class="username">${comment.user.username}</span>
            ${comment.user.username === currentUser.username ? `<span class="you">You</span>` : ''}
            ${comment.createdAt}</p>
          </div>
          <div class="commentSectionContent">
            <p class="commentText">${comment.content}</p>
          </div>
        </div>
        <div class="buttons">
          ${currentUser.username === comment.user.username ? `
            <button class="deleteButton" id="delete-${comment.id}" onclick="deleteComment(event)">
              <img src="./images/icon-delete.svg" alt="delete icon"> Delete
            </button>
            <button class="editButton" id="edit-${comment.id}" onclick="editComment(event)">
              <img src="./images/icon-edit.svg" alt="edit icon"> Edit
            </button>` : `
            <button class="replyButton" id="reply-${comment.id}" onclick="addReply(event)">
              <img src="./images/icon-reply.svg" alt="reply icon"> Reply
            </button>`}
        </div>
      </div>
      <div class="replies" id="replies-${comment.id}"></div>
    `;
  });
};

const displayReplies = () => {
  if (replies.length === 0) return;

  replies.forEach(replyGroup => {
    const repliesContainer = document.getElementById(`replies-${replyGroup.id}`);
    if (!repliesContainer) return;

    repliesContainer.innerHTML = '';
    replyGroup.replies.forEach(reply => {
      repliesContainer.innerHTML += `
        <div class="comment reply" id="reply-${reply.id}">
          <div class="likeCounter">
            <img src="./images/icon-plus.svg" alt="plus" id="plus-${reply.id}" class="plus" onclick="changeCounter(event)">
            <span class="countLike" id="count-${reply.id}">${reply.score}</span>
            <img src="./images/icon-minus.svg" alt="minus" id="minus-${reply.id}" class="minus" onclick="changeCounter(event)">
          </div>
          <div class="commentSection">
            <div class="commentSectionHeader">
              <img src="${reply.user.image.png}" alt="user image" class="userImage">
              <p><span class="username">${reply.user.username}</span>
              ${reply.user.username === currentUser.username ? `<span class="you">You</span>` : ''} ${reply.createdAt}</p>
            </div>
            <div class="commentSectionContent">
              <p class="commentText"><span class="replyTo">@${reply.replyingTo}</span> ${reply.content}</p>
            </div>
          </div>
          <div class="buttons">
            ${currentUser.username === reply.user.username ? `
              <button class="deleteButton" id="delete-${reply.id}" onclick="deleteComment(event)">
                <img src="./images/icon-delete.svg" alt="delete icon"> Delete
              </button>
              <button class="editButton" id="edit-${reply.id}" onclick="editComment(event)">
                <img src="./images/icon-edit.svg" alt="edit icon"> Edit
              </button>` : `
              <button class="replyButton" id="reply-${reply.id}" onclick="addReply(event)">
                <img src="./images/icon-reply.svg" alt="reply icon"> Reply
              </button>`}
          </div>
        </div>
      `;
    });
  });
};

const printContent = async () => {
  await fetchData();

  if (!currentUser || !currentUser.image) {
    form.innerHTML = '<p>Loading user info...</p>';
    return;
  }

  if (comments.length === 0) {
    commentContainer.innerHTML = '<p>No comments available.</p>';
    return;
  }

  form.innerHTML = `
    <img class="userImage" src="${currentUser.image.png}" alt="user Image">
    <textarea class="commentInput" placeholder="Add a comment..."></textarea>
    <button class="sendButton" type="submit" onclick="addComment(event)">SEND</button>
  `;

  displayComments();
  displayReplies();
};
printContent();


//edit comment and reply
//add comnment 