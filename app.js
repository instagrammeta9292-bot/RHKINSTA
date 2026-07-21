import { db, storage } from "./firebaseConfig.js";
import { 
  collection, doc, getDoc, setDoc, updateDoc, addDoc, 
  onSnapshot, query, orderBy, serverTimestamp, getDocs, where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Session / Active User Initialization (Real-time active storage profile identifier)
let currentUsername = localStorage.getItem("rhk_current_user") || "ragha_v0069";

// Handle Splash Screen Transition
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("splash-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    initApp();
  }, 1200);
});

async function initApp() {
  await ensureUserProfileExists(currentUsername);
  setupNavigation();
  loadGlobalProfileAvatar();
  navigateTo("home");
}

async function ensureUserProfileExists(username) {
  const userRef = doc(db, "users", username);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      username: username,
      fullName: "Raghav Hk",
      bio: "RHK Brand Creator",
      website: "",
      avatarUrl: "https://via.placeholder.com/150",
      followersCount: 19,
      followingCount: 30,
      createdAt: serverTimestamp()
    });
  }
}

async function loadGlobalProfileAvatar() {
  const userRef = doc(db, "users", currentUsername);
  const snap = await getDoc(userRef);
  if (snap.exists() && snap.data().avatarUrl) {
    document.getElementById("nav-user-avatar").src = snap.data().avatarUrl;
  }
}

// Navigation Handler
function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      const target = btn.getAttribute("data-target") || btn.closest(".nav-btn").getAttribute("data-target");
      btn.classList.add("active");
      navigateTo(target);
    });
  });

  document.getElementById("btn-create-post").addEventListener("click", () => renderCreatePostModal());
  document.getElementById("btn-notifications").addEventListener("click", () => navigateTo("activity"));
  document.getElementById("btn-messages").addEventListener("click", () => renderMessagesView());
}

function navigateTo(view, param = null) {
  const container = document.getElementById("content-container");
  container.innerHTML = "";

  switch(view) {
    case "home":
      renderHomeFeed(container);
      break;
    case "search":
      renderSearchView(container);
      break;
    case "reels":
      renderReelsView(container);
      break;
    case "activity":
      renderActivityView(container);
      break;
    case "profile":
      renderProfileView(container, currentUsername);
      break;
    case "user-profile":
      renderProfileView(container, param);
      break;
    default:
      renderHomeFeed(container);
  }
}

// 1. Home Feed View
function renderHomeFeed(container) {
  container.innerHTML = `
    <div class="stories-container" id="stories-bar"></div>
    <div id="posts-feed"></div>
  `;

  // Fetch real-time posts from Firestore
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const feed = document.getElementById("posts-feed");
    feed.innerHTML = "";
    if (snapshot.empty) {
      feed.innerHTML = `<div style="text-align:center; padding:40px; color:#8e8e8e;">No posts yet. Share your first photo!</div>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const post = docSnap.data();
      const postId = docSnap.id;
      const isLiked = post.likes && post.likes.includes(currentUsername);

      const postEl = document.createElement("div");
      postEl.className = "post-card";
      postEl.innerHTML = `
        <div class="post-header">
          <div class="post-user-info" data-user="${post.username}">
            <img src="${post.userAvatar || 'https://via.placeholder.com/150'}" alt="">
            <span class="post-username">${post.username}</span>
          </div>
          <i class="fa-solid fa-ellipsis"></i>
        </div>
        <div class="post-image-container">
          <img src="${post.imageUrl}" alt="Post Image">
        </div>
        <div class="post-actions">
          <div class="post-action-left">
            <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart ${isLiked ? 'liked' : ''}" id="like-btn-${postId}"></i>
            <i class="fa-regular fa-comment"></i>
            <i class="fa-regular fa-paper-plane"></i>
          </div>
          <i class="fa-regular fa-bookmark"></i>
        </div>
        <div class="post-likes">${post.likes ? post.likes.length : 0} likes</div>
        <div class="post-caption"><span class="uname">${post.username}</span>${post.caption || ''}</div>
      `;

      // Like interaction
      postEl.querySelector(`#like-btn-${postId}`).addEventListener("click", async () => {
        const postRef = doc(db, "posts", postId);
        const currentLikes = post.likes || [];
        let updatedLikes;
        if (currentLikes.includes(currentUsername)) {
          updatedLikes = currentLikes.filter(u => u !== currentUsername);
        } else {
          updatedLikes = [...currentLikes, currentUsername];
          // Log notification for real user interaction
          if (post.username !== currentUsername) {
            await addDoc(collection(db, "notifications"), {
              recipient: post.username,
              sender: currentUsername,
              type: "like",
              createdAt: serverTimestamp()
            });
          }
        }
        await updateDoc(postRef, { likes: updatedLikes });
      });

      // User profile redirect interaction
      postEl.querySelector(".post-user-info").addEventListener("click", () => {
        navigateTo("user-profile", post.username);
      });

      feed.appendChild(postEl);
    });
  });
}

// 2. Search View
function renderSearchView(container) {
  container.innerHTML = `
    <div class="search-bar-container">
      <div class="search-input-wrap">
        <i class="fa-solid fa-magnifying-glass" style="color: #8e8e8e;"></i>
        <input type="text" id="search-box" placeholder="Search real users...">
      </div>
    </div>
    <div class="search-results-list" id="search-results"></div>
  `;

  const searchBox = document.getElementById("search-box");
  searchBox.addEventListener("input", async (e) => {
    const term = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById("search-results");
    resultsContainer.innerHTML = "";

    if (!term) return;

    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach(docSnap => {
      const userData = docSnap.data();
      if (userData.username.toLowerCase().includes(term) || (userData.fullName && userData.fullName.toLowerCase().includes(term))) {
        const row = document.createElement("div");
        row.className = "user-row";
        row.innerHTML = `
          <div class="user-row-left">
            <img src="${userData.avatarUrl || 'https://via.placeholder.com/150'}" alt="">
            <div class="user-row-info">
              <div class="username">${userData.username}</div>
              <div class="fullname">${userData.fullName || ''}</div>
            </div>
          </div>
        `;
        row.addEventListener("click", () => navigateTo("user-profile", userData.username));
        resultsContainer.appendChild(row);
      }
    });
  });
}

// 3. Reels View
function renderReelsView(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; height:100%; color:#8e8e8e;">
      <h3>RHK Reels Feed</h3>
    </div>
  `;
}

// 4. Activity / Notifications View
function renderActivityView(container) {
  container.innerHTML = `
    <div style="padding: 12px 16px; font-weight: bold; font-size: 1.1rem; background:#fff; border-bottom:1px solid #dbdbdb;">Notifications</div>
    <div id="notifications-list" style="background:#fff;"></div>
  `;

  const listEl = document.getElementById("notifications-list");
  const q = query(collection(db, "notifications"), where("recipient", "==", currentUsername), orderBy("createdAt", "desc"));
  
  onSnapshot(q, (snapshot) => {
    listEl.innerHTML = "";
    if (snapshot.empty) {
      listEl.innerHTML = `<div style="padding:20px; text-align:center; color:#8e8e8e;">No recent activity</div>`;
      return;
    }
    snapshot.forEach(docSnap => {
      const notif = docSnap.data();
      const row = document.createElement("div");
      row.className = "user-row";
      row.innerHTML = `
        <div class="user-row-left">
          <div class="user-row-info">
            <div style="font-size: 0.9rem;"><span style="font-weight:600;">${notif.sender}</span> started following you or interacted with your post.</div>
          </div>
        </div>
      `;
      listEl.appendChild(row);
    });
  });
}

// 5. Profile View (Supports viewing your profile or any real-time user profile)
async function renderProfileView(container, profileUsername) {
  const userRef = doc(db, "users", profileUsername);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.exists() ? userSnap.data() : { username: profileUsername, fullName: "", bio: "", avatarUrl: "https://via.placeholder.com/150", followersCount: 0, followingCount: 0 };

  const isSelf = profileUsername === currentUsername;

  container.innerHTML = `
    <div class="profile-header-section">
      <div class="profile-top-row">
        <img class="profile-avatar-large" src="${userData.avatarUrl}" alt="Avatar">
        <div class="profile-stats">
          <div><div class="stat-num" id="stat-posts">0</div><div class="stat-label">posts</div></div>
          <div><div class="stat-num">${userData.followersCount || 0}</div><div class="stat-label">followers</div></div>
          <div><div class="stat-num">${userData.followingCount || 0}</div><div class="stat-label">following</div></div>
        </div>
      </div>
      <div class="profile-bio-section">
        <div class="profile-fullname">${userData.fullName || profileUsername}</div>
        <div class="profile-bio-text">${userData.bio || ''}</div>
      </div>
      <div class="profile-action-btns">
        ${isSelf ? `<button id="btn-edit-profile">Edit Profile</button><button>Share profile</button>` : `<button class="primary" id="btn-follow">Follow</button>`}
      </div>
    </div>
    <div class="profile-tabs">
      <i class="fa-solid fa-table-cells active"></i>
      <i class="fa-regular fa-bookmark"></i>
      <i class="fa-regular fa-user"></i>
    </div>
    <div class="profile-grid" id="user-posts-grid"></div>
  `;

  if (isSelf) {
    document.getElementById("btn-edit-profile").addEventListener("click", () => renderEditProfileModal(userData));
  }

  // Load user specific posts grid
  const postsQuery = query(collection(db, "posts"), where("username", "==", profileUsername));
  const postSnapshots = await getDocs(postsQuery);
  const gridEl = document.getElementById("user-posts-grid");
  document.getElementById("stat-posts").innerText = postSnapshots.size;

  postSnapshots.forEach(docSnap => {
    const postData = docSnap.data();
    const item = document.createElement("div");
    item.className = "profile-grid-item";
    item.innerHTML = `<img src="${postData.imageUrl}" alt="Grid Post">`;
    gridEl.appendChild(item);
  });
}

// Edit Profile Modal View
function renderEditProfileModal(userData) {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div style="padding: 16px; background:#fff; height:100%;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <i class="fa-solid fa-arrow-left" id="back-profile" style="cursor:pointer; font-size:1.2rem;"></i>
        <h3 style="font-size:1rem;">Edit Profile</h3>
        <i class="fa-solid fa-check" id="save-profile" style="cursor:pointer; font-size:1.2rem; color:#0095f6;"></i>
      </div>
      <div style="text-align:center; margin-bottom:20px;">
        <img src="${userData.avatarUrl}" style="width:80px; height:80px; border-radius:50%; object-fit:cover;" id="edit-avatar-preview">
        <div><label for="avatar-file-input" style="color:#0095f6; font-weight:600; font-size:0.9rem; cursor:pointer; display:inline-block; margin-top:8px;">Change photo</label></div>
        <input type="file" id="avatar-file-input" class="hidden" accept="image/*">
      </div>
      <div style="margin-bottom:15px;">
        <label style="font-size:0.8rem; color:#8e8e8e;">Name</label>
        <input type="text" id="edit-fullname" value="${userData.fullName || ''}" style="width:100%; border:none; border-bottom:1px solid #dbdbdb; padding:6px 0; outline:none; font-size:1rem;">
      </div>
      <div style="margin-bottom:15px;">
        <label style="font-size:0.8rem; color:#8e8e8e;">Bio</label>
        <textarea id="edit-bio" style="width:100%; border:none; border-bottom:1px solid #dbdbdb; padding:6px 0; outline:none; font-size:1rem; resize:none;">${userData.bio || ''}</textarea>
      </div>
    </div>
  `;

  document.getElementById("back-profile").addEventListener("click", () => navigateTo("profile"));

  let newAvatarUrl = userData.avatarUrl;
  document.getElementById("avatar-file-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      newAvatarUrl = await uploadToCloudinary(file);
      document.getElementById("edit-avatar-preview").src = newAvatarUrl;
    }
  });

  document.getElementById("save-profile").addEventListener("click", async () => {
    const fullName = document.getElementById("edit-fullname").value;
    const bio = document.getElementById("edit-bio").value;

    await updateDoc(doc(db, "users", currentUsername), {
      fullName,
      bio,
      avatarUrl: newAvatarUrl
    });
    loadGlobalProfileAvatar();
    navigateTo("profile");
  });
}

// Create Post Modal View
function renderCreatePostModal() {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div style="padding: 16px; background:#fff; height:100%;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <i class="fa-solid fa-xmark" id="cancel-post" style="cursor:pointer; font-size:1.3rem;"></i>
        <h3 style="font-size:1rem;">New Post</h3>
        <span id="share-post-btn" style="color:#0095f6; font-weight:600; cursor:pointer;">Share</span>
      </div>
      <div style="text-align:center; border:2px dashed #dbdbdb; padding:30px; border-radius:8px; margin-bottom:15px;" id="drop-zone">
        <i class="fa-regular fa-image" style="font-size:3rem; color:#8e8e8e; margin-bottom:10px;"></i>
        <div><label for="post-file-input" style="color:#0095f6; font-weight:600; cursor:pointer;">Select photo from device</label></div>
        <input type="file" id="post-file-input" class="hidden" accept="image/*">
        <img id="post-img-preview" class="hidden" style="max-width:100%; max-height:250px; border-radius:6px; margin-top:10px;">
      </div>
      <div>
        <textarea id="post-caption-input" placeholder="Write a caption..." style="width:100%; border:1px solid #dbdbdb; padding:10px; border-radius:6px; outline:none; resize:none; height:80px;"></textarea>
      </div>
    </div>
  `;

  let selectedImageUrl = "";
  document.getElementById("cancel-post").addEventListener("click", () => navigateTo("home"));

  document.getElementById("post-file-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedImageUrl = await uploadToCloudinary(file);
      const preview = document.getElementById("post-img-preview");
      preview.src = selectedImageUrl;
      preview.classList.remove("hidden");
    }
  });

  document.getElementById("share-post-btn").addEventListener("click", async () => {
    if (!selectedImageUrl) {
      alert("Please select an image first.");
      return;
    }
    const caption = document.getElementById("post-caption-input").value;
    const userRef = doc(db, "users", currentUsername);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    await addDoc(collection(db, "posts"), {
      username: currentUsername,
      userAvatar: userData.avatarUrl || "",
      imageUrl: selectedImageUrl,
      caption: caption,
      likes: [],
      createdAt: serverTimestamp()
    });

    navigateTo("home");
  });
}

// Messages / Direct Inbox View
function renderMessagesView() {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div class="dm-container">
      <div class="dm-header">
        <span>${currentUsername}</span>
        <i class="fa-regular fa-pen-to-square"></i>
      </div>
      <div style="padding: 20px; text-align:center; color:#8e8e8e;">
        <p>Direct Messages connected via real-time sync.</p>
      </div>
    </div>
  `;
}

// Cloudinary Upload Utility Helper
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "rhk_upload");

  const response = await fetch("https://api.cloudinary.com/v1_1/nhy9lfkt/image/upload", {
    method: "POST",
    body: formData
  });
  const data = await response.json();
  return data.secure_url;
                                        }

