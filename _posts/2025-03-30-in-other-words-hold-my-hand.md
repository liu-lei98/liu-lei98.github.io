---
date: 2025-03-30 12:12:12
layout: post
title: in other words hold my hand
subtitle: fly me to the moon
description: in other words hold my hand
image: /assets/gallery/gallery-2024/Hold-hand/IMG_1860.JPG
optimized_image: /assets/gallery/gallery-2024/Hold-hand/IMG_1860.JPG
category: life
tags:
  - life
  - HDU
author: Lei
---

<style>
/* 对话气泡基础样式 */
.chat-container {
  margin-bottom: 25px; /* 增加气泡间距 */
  clear: both;
}
.bubble {
  max-width: 70%;
  padding: 12px 16px; /* 增加内边距 */
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* 添加轻微阴影 */
  transition: transform 0.2s ease; /* 添加悬停动画 */
}
.bubble:hover {
  transform: translateY(-2px); /* 悬停上浮效果 */
}
.left-bubble {
  float: left;
  background-color: #e3f2fd;
  text-align: left;
  margin-right: 15%; /* 增加左右气泡间距 */
}
.right-bubble {
  float: right;
  background-color: #f5f5f5;
  text-align: left;
  margin-left: 15%; /* 增加左右气泡间距 */
}
/* 图片气泡特殊处理 */
.photo-bubble {
  padding: 8px;
  text-align: center;
}
.photo-bubble img {
  max-width: 100%;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.photo-bubble img:hover {
  opacity: 0.8;
  transform: scale(1.02);
}
/* 音乐触发气泡 */
.music-trigger {
  cursor: pointer;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(227, 242, 253, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(227, 242, 253, 0); }
  100% { box-shadow: 0 0 0 0 rgba(227, 242, 253, 0); }
}
/* 模态框样式 */
.modal {
  display: none;
  position: fixed;
  z-index: 9999;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.9);
  cursor: pointer; /* 点击任意位置关闭 */
}
.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  max-width: 90%;
  margin: 0 auto;
}
.modal-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}
.modal-caption {
  color: white;
  margin-top: 15px;
  font-size: 1.1rem;
  text-align: center;
  padding: 0 20px;
}
.close {
  position: absolute;
  top: 25px;
  right: 35px;
  color: white;
  font-size: 40px;
  font-weight: bold;
  cursor: pointer;
}
/* 音乐按钮 */
.music-btn {
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 999;
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}
.music-btn:hover {
  transform: scale(1.1);
  background: #ffecec;
}
</style>

<!-- 音乐播放器 (默认隐藏) -->
<audio id="bgMusic" loop>
  <source src="/assets/music/1.mp3" type="audio/mpeg">
</audio>

<!-- 音乐触发气泡 -->
<div class="chat-container">
  <div class="bubble left-bubble music-trigger" onclick="startMusic()">
    🎵 点击此处开始背景音乐
  </div>
</div>

<!-- 对话开始 -->
<div class="chat-container">
  <div class="bubble left-bubble">
    🍑：采访一下单身的酸，为什么要拍牵手呢？
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：我们每个人都距离很远，但牵手的时候却很近！就像我真的认识到你了一样！
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <a href="https://www.bilibili.com/video/BV1XYU5Y4EQg" target="_blank">
      <img src="/assets/img/1.jpg" alt="B站视频封面">
    </a>
  </div>
</div>


<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：我第一部相机是fe，也是浅田家中出现的相机，开始拍摄也是因此，去记录那些消失的瞬间。希望能够再次看到照片的时候也能感觉到幸福！
  </div>
</div>

<div class="chat-container">
  <div class="bubble left-bubble">
    浅田：我会去拍你的幸福，无论多远！
  </div>
</div>

<!-- 图片对话部分 -->
<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/IMG_1860.JPG" alt="牵手照片" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble left-bubble">
    🥱：这个是拍的啥？
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：大爷在前面看着导航，一直在和大妈解释"嘿，我们接下来要往这走"，大妈"嗯！"，"ride with me, to the edge of the sunset!"
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520004.jpg" alt="牵手照片2" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：这个故事很简单，"好啦好啦，我牵着就是了"。
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520007.jpg" alt="小孩的手" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble left-bubble">
    🥱：这个我知道是小孩的手，他在干嘛了
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：是她啦！在地铁上看见人就会笑的小孩！因为累了所以垂下的手，旁边的母亲在笑着看着她。
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520008.jpg" alt="老成的小孩" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨：非常老成的小孩，就在上面睡着的小孩下车后上了地铁，一直皱着眉头看着地铁到站信息。啊他真的看得懂吗？
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520030.jpg" alt="法语誓言" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨："Je resterai à tes côtés quoi qu'il arrive." 无论什么我都会在你身边！
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520031.jpg" alt="法语跳过来" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨："跳过来，我会抓住你的！" Allez, saute ! Je te promets de pas te laisser tomber !
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520033.jpg" alt="温柔的手" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨："反正就是挺温柔的就是了"
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble photo-bubble">
    <img src="/assets/gallery/gallery-2024/Hold-hand/000045520037.jpg" alt="扶着手" onclick="openModal(this.src, '偶尔也会不一样')">
  </div>
</div>

<div class="chat-container">
  <div class="bubble right-bubble">
    🪨："对对对，就是这样，我扶着你的，放心！"
  </div>
</div>

<!-- 模态框 -->
<div id="imageModal" class="modal" onclick="closeModal()">
  <span class="close" onclick="closeModal(event)">&times;</span>
  <div class="modal-content">
    <img class="modal-img" id="modalImage">
    <div class="modal-caption" id="modalCaption"></div>
  </div>
</div>

<!-- 音乐控制按钮 -->
<button class="music-btn" id="musicBtn" onclick="toggleMusic()">🔇</button>

<script>
// 音乐播放器控制
const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
let musicStarted = false;

// 点击音乐触发气泡开始播放
function startMusic() {
  if (!musicStarted) {
    bgMusic.volume = 0.3;
    bgMusic.play()
      .then(() => {
        musicStarted = true;
        musicBtn.textContent = "🔊";
      })
      .catch(e => {
        alert("请点击页面任意位置后，再点击音乐气泡播放");
      });
  }
}

// 切换音乐播放状态
function toggleMusic() {
  if (bgMusic.paused) {
    bgMusic.play();
    musicBtn.textContent = "🔊";
  } else {
    bgMusic.pause();
    musicBtn.textContent = "🔇";
  }
}

// 图片模态框
function openModal(src, caption) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const captionText = document.getElementById("modalCaption");
  
  modal.style.display = "block";
  modalImg.src = src;
  captionText.innerHTML = caption;
  document.body.style.overflow = "hidden"; // 防止背景滚动
}

function closeModal(event) {
  // 阻止事件冒泡，只有点击关闭按钮时才执行
  if (event && event.target.className !== 'close') return;
  
  document.getElementById("imageModal").style.display = "none";
  document.body.style.overflow = "auto"; // 恢复滚动
}

// 点击模态框外部关闭
window.onclick = function(event) {
  if (event.target == document.getElementById("imageModal")) {
    closeModal(event);
  }
}

// 用户首次交互后尝试自动播放音乐
document.addEventListener('click', function firstInteraction() {
  bgMusic.play().then(() => {
    bgMusic.pause(); // 预加载但不播放
  }).catch(e => {});
  document.removeEventListener('click', firstInteraction);
}, { once: true });
</script>