---
title: 关于我
date: 2024-05-20 10:00:00
type: about
comments: false  # 可选，关闭评论
aside: false     # 可选，隐藏侧边栏，让页面更聚焦
description: 关于我
---

{% raw %}
<div style="display: flex; align-items: center; margin-bottom: 20px;">
  <img src="https://loveapple.icu/img/machinist.jpg" alt="头像" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-right: 20px;">
  <div>
    <h2 style="margin: 0;">LoveApple14434/水煮鱼</h2>
    <p style="margin: 5px 0 0; color: #666;">南京大学电子科学与工程学院 本科在读</p>
    <p style="margin: 2px 0 0; color: #666;">专业方向：射频电路通信</p>
  </div>
</div>
{% endraw %}

## 🔧 关于我

- **社团经历**：曾任南京大学学生IT侠互助协会社长，热衷于用技术帮助同学解决电脑问题。
- **业余爱好**：
    - 📻业余无线电
    - 🏸羽毛球
    - 💻笔记本维修
    - 📝折腾博客网站
    - 🛠️DIY软路由与NAS

## 🖥️ 技术栈

（根据熟练度赋值图标大小）
<i class="devicon-c-original colored" style="font-size: 64px;"></i> 
<i class="devicon-cplusplus-plain colored" style="font-size: 48px;"></i> 
<i class="devicon-python-plain colored" style="font-size: 64px;"></i> 
<i class="devicon-latex-original colored" style="font-size: 64px;"></i> 
<i class="devicon-markdown-original colored" style="font-size: 64px;"></i> 
<i class="devicon-html5-plain colored" style="font-size: 24px;"></i>
<i class="devicon-bash-plain colored" style="font-size: 40px"></i>
<i class="devicon-cmake-plain colored" style="font-size: 32px"></i>
<i class="devicon-git-plain colored " style="font-size: 48px"></i>
<i class="devicon-powershell-plain colored" style="font-size: 18px"></i>

### 📫 联系我

- **Bilibili**：[LoveApple14434](https://space.bilibili.com/190956075)
- **GitHub**：[LoveApple14434](https://github.com/loveapple14434)
- **QQ**：<button id="copyBtn">LoveApple</button>
- **邮箱**：[QQ mail](mailto://harry.zy.su@qq.com)
- **无线电呼号**：[BA4UHI](https://qrz.com/db/BA4UHI)

{% raw %}
<script>
  const textToCopy = "1985671808";

  document.getElementById('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      alert('复制成功！');
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  });
</script>
{% endraw %}