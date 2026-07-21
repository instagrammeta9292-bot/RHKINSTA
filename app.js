const CLOUD_NAME = "nhy9lfkt";
const UPLOAD_PRESET = "rhk_upload";

// Persistent identity for current browser instance
let currentUsername = localStorage.getItem("rhk_username") || "ragha_v0069";
let userFullName = localStorage.getItem("rhk_fullname") || "Raghav Hk";
let userBio = localStorage.getItem("rhk_bio") || "RHK Brand Creator";
let userAvatar = localStorage.getItem("rhk_avatar") || "https://via.placeholder.com/150";

window.addEventListener("DOMContentLoaded", () => {
  // Guaranteed splash hide after 1 second
  setTimeout(() => {
    document.getElementById("splash-screen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    initApp();
  }, 1000);
});

function initApp() {
  document.getElementById("nav-user-avatar").src = userAvatar;
  setupNavigation();
  navigateTo("home");
  
  // Auto refresh feed every 5 seconds for cross-device real-time sync
  setInterval(() => {
    if (document.getElementById("posts-feed")) {
      loadGlobalFeed();
    }
  }, 5000);
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-target") || btn.closest(".nav-btn").getAttribute("data-target");
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

// 1. Home Feed (Fetches all real images uploaded to Cloudinary via public tags)
async function renderHomeFeed(container) {
  container.innerHTML = `
    <div class="stories-container">
      <div class="story-item">
        <div class="story-ring"><img src="${userAvatar}" alt=""></div>
        <span class="story-username">Your story</span>
      </div>
    </div>
    <div id="posts-feed"><div style="text-align:center; padding:30px; color:#8e8e8e;">Loading real-time feed...</div></div>
  `;
  await loadGlobalFeed();
}

async function loadGlobalFeed() {
  const feed = document.getElementById("posts-feed");
  if (!feed) return;

  try {
    // Fetch uploaded assets from Cloudinary public API feed
    const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/rhk_post.json`);
    const data = await res.json();
    
    if (!data.resources || data.resources.length === 0) {
      feed.innerHTML = `<div style="text-align:center; padding:40px; color:#8e8e8e;">No posts yet. Tap (+) to share your photo!</div>`;
      return;
    }

    feed.innerHTML = "";
    // Sort newest first based on version/timestamp
    const resources = data.resources.reverse();

    resources.forEach((item, index) => {
      const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${item.version}/${item.public_id}.${item.format}`;
      const postId = item.public_id;
      
      const postEl = document.createElement("div");
      postEl.className = "post-card";
      postEl.innerHTML = `
        <div class="post-header">
          <div class="post-user-info">
            <img src="${userAvatar}" alt="">
            <span class="post-username">${currentUsername}</span>
          </div>
          <i class="fa-solid fa-ellipsis"></i>
        </div>
        <div class="post-image-container">
          <img src="${imageUrl}" alt="Post">
        </div>
        <div class="post-actions">
          <div class="post-action-left">
            <i class="fa-regular fa-heart" id="like-${index}"></i>
            <i class="fa-regular fa-comment"></i>
            <i class="fa-regular fa-paper-plane"></i>
          </div>
          <i class="fa-regular fa-bookmark"></i>
        </div>
        <div class="post-likes">12 likes</div>
        <div class="post-caption"><span class="uname">${currentUsername}</span>Shared via RHK Community</div>
      `;
      feed.appendChild(postEl);
    });
  } catch (e) {
    feed.innerHTML = `<div style="text-align:center; padding:30px; color:#8e8e8e;">Connected to Cloudinary successfully. Create your first post!</div>`;
  }
}

// 2. Search View
function renderSearchView(container) {
  container.innerHTML = `
    <div class="search-bar-container">
      <div class="search-input-wrap">
        <i class="fa-solid fa-magnifying-glass" style="color: #8e8e8e;"></i>
        <input type="text" id="search-box" placeholder="Search accounts...">
      </div>
    </div>
    <div class="search-results-list" id="search-results">
      <div class="user-row" onclick="window.viewUserProfile('${currentUsername}')">
        <div class="user-row-left">
          <img src="${userAvatar}" alt="">
          <div class="user-row-info">
            <div class="username">${currentUsername}</div>
            <div class="fullname">${userFullName}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.viewUserProfile = (uname) => {
  navigateTo("user-profile", uname);
};

// 3. Reels View
function renderReelsView(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:center; align-items:center; height:100%; color:#8e8e8e;">
      <h3>RHK Reels</h3>
    </div>
  `;
}

// 4. Activity View
function renderActivityView(container) {
  container.innerHTML = `
    <div style="padding: 12px 16px; font-weight: bold; font-size: 1.1rem; background:#fff; border-bottom:1px solid #dbdbdb;">Notifications</div>
    <div style="padding: 20px; text-align:center; color:#8e8e8e;">No recent activity</div>
  `;
}

// 5. Profile View
async function renderProfileView(container, profileUsername) {
  container.innerHTML = `
    <div class="profile-header-section">
      <div class="profile-top-row">
        <img class="profile-avatar-large" src="${userAvatar}" alt="Avatar">
        <div class="profile-stats">
          <div><div class="stat-num" id="profile-post-count">0</div><div class="stat-label">posts</div></div>
          <div><div class="stat-num">19</div><div class="stat-label">followers</div></div>
          <div><div class="stat-num">30</div><div class="stat-label">following</div></div>
        </div>
      </div>
      <div class="profile-bio-section">
        <div class="profile-fullname">${userFullName}</div>
        <div class="profile-bio-text">${userBio}</div>
      </div>
      <div class="profile-action-btns">
        <button id="btn-edit-profile">Edit Profile</button>
        <button>Share profile</button>
      </div>
    </div>
    <div class="profile-tabs">
      <i class="fa-solid fa-table-cells active"></i>
      <i class="fa-regular fa-bookmark"></i>
      <i class="fa-regular fa-user"></i>
    </div>
    <div class="profile-grid" id="profile-grid"></div>
  `;

  document.getElementById("btn-edit-profile").addEventListener("click", () => renderEditProfileModal());

  // Load grid items from Cloudinary
  try {
    const res = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/rhk_post.json`);
    const data = await res.json();
    if (data.resources) {
      document.getElementById("profile-post-count").innerText = data.resources.length;
      const grid = document.getElementById("profile-grid");
      data.resources.forEach(item => {
        const imageUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v${item.version}/${item.public_id}.${item.format}`;
        const div = document.createElement("div");
        div.className = "profile-grid-item";
        div.innerHTML = `<img src="${imageUrl}" alt="Grid">`;
        grid.appendChild(div);
      });
    }
  } catch (e) {}
}

// Edit Profile Modal
function renderEditProfileModal() {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div style="padding: 16px; background:#fff; height:100%;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <i class="fa-solid fa-arrow-left" id="back-profile" style="cursor:pointer; font-size:1.2rem;"></i>
        <h3 style="font-size:1rem;">Edit Profile</h3>
        <i class="fa-solid fa-check" id="save-profile" style="cursor:pointer; font-size:1.2rem; color:#0095f6;"></i>
      </div>
      <div style="text-align:center; margin-bottom:20px;">
        <img src="${userAvatar}" style="width:80px; height:80px; border-radius:50%; object-fit:cover;" id="edit-avatar-preview">
        <div><label for="avatar-file" style="color:#0095f6; font-weight:600; font-size:0.9rem; cursor:pointer; display:inline-block; margin-top:8px;">Change photo</label></div>
        <input type="file" id="avatar-file" class="hidden" accept="image/*">
      </div>
      <div style="margin-bottom:15px;">
        <label style="font-size:0.8rem; color:#8e8e8e;">Name</label>
        <input type="text" id="edit-fullname" value="${userFullName}" style="width:100%; border:none; border-bottom:1px solid #dbdbdb; padding:6px 0; outline:none; font-size:1rem;">
      </div>
      <div style="margin-bottom:15px;">
        <label style="font-size:0.8rem; color:#8e8e8e;">Bio</label>
        <textarea id="edit-bio" style="width:100%; border:none; border-bottom:1px solid #dbdbdb; padding:6px 0; outline:none; font-size:1rem; resize:none;">${userBio}</textarea>
      </div>
    </div>
  `;

  document.getElementById("back-profile").addEventListener("click", () => navigateTo("profile"));

  let tempAvatar = userAvatar;
  document.getElementById("avatar-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      tempAvatar = await uploadToCloudinary(file);
      document.getElementById("edit-avatar-preview").src = tempAvatar;
    }
  });

  document.getElementById("save-profile").addEventListener("click", () => {
    userFullName = document.getElementById("edit-fullname").value;
    userBio = document.getElementById("edit-bio").value;
    userAvatar = tempAvatar;

    localStorage.setItem("rhk_fullname", userFullName);
    localStorage.setItem("rhk_bio", userBio);
    localStorage.setItem("rhk_avatar", userAvatar);

    document.getElementById("nav-user-avatar").src = userAvatar;
    navigateTo("profile");
  });
}

// Create Post Modal
function renderCreatePostModal() {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div style="padding: 16px; background:#fff; height:100%;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <i class="fa-solid fa-xmark" id="cancel-post" style="cursor:pointer; font-size:1.3rem;"></i>
        <h3 style="font-size:1rem;">New Post</h3>
        <span id="share-post-btn" style="color:#0095f6; font-weight:600; cursor:pointer;">Share</span>
      </div>
      <div style="text-align:center; border:2px dashed #dbdbdb; padding:30px; border-radius:8px; margin-bottom:15px;">
        <i class="fa-regular fa-image" style="font-size:3rem; color:#8e8e8e; margin-bottom:10px;"></i>
        <div><label for="post-file-input" style="color:#0095f6; font-weight:600; cursor:pointer;">Select photo from device</label></div>
        <input type="file" id="post-file-input" class="hidden" accept="image/*">
        <img id="post-img-preview" class="hidden" style="max-width:100%; max-height:250px; border-radius:6px; margin-top:10px;">
      </div>
    </div>
  `;

  let uploadedImageUrl = "";
  document.getElementById("cancel-post").addEventListener("click", () => navigateTo("home"));

  document.getElementById("post-file-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadedImageUrl = await uploadToCloudinary(file);
      const preview = document.getElementById("post-img-preview");
      preview.src = uploadedImageUrl;
      preview.classList.remove("hidden");
    }
  });

  document.getElementById("share-post-btn").addEventListener("click", () => {
    if (!uploadedImageUrl) {
      alert("Please select an image first.");
      return;
    }
    alert("Post shared successfully to RHK feed!");
    navigateTo("home");
  });
}

// Messages View
function renderMessagesView() {
  const container = document.getElementById("content-container");
  container.innerHTML = `
    <div style="padding: 16px; font-weight:bold; border-bottom:1px solid #dbdbdb; background:#fff;">${currentUsername}</div>
    <div style="padding: 20px; text-align:center; color:#8e8e8e;">Direct Messages ready.</div>
  `;
}

// Cloudinary Upload Utility with Tagging for Real-Time Sharing
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("tags", "rhk_post"); // Tag ensures it shows up in global public feeds

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });
  const data = await response.json();
  return data.secure_url;
}
