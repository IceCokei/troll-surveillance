# Chollima 演示视频逐帧分析

- 视频：<https://x.com/calif_io/status/2111080247944745106/video/1>（帖文原文：“3/ Can your iPhone do this?”）
- 直链：`https://video.twimg.com/amplify_video/2111076886621179904/vid/avc1/1920x1292/sis5T70VAGzlFfDw.mp4`
- 规格：1920×1292 / 60fps / 90.8s / 画面标注 **4x speed**（实际约 6 分钟）
- 分析方式：ffmpeg 抽帧 1fps（91 帧）→ tesseract OCR → 人工比对关键帧
- 画面构成：左半为 Mac 终端，右半为 iPhone 镜像（窗口标题显示 `iOS 27.0.1`）

## 1. 时间轴（视频时间 / 画面内时钟）

| 视频时间 | 画面内时间 | 画面 | 关键文本（OCR 原文） |
| --- | --- | --- | --- |
| 0–10s | 18:46 | iPhone 设置 / 主屏 | 无终端内容 |
| 11–30s | 18:47–18:48 | Chollima App 启动 | `Chollima` / `Starting...` / `Start` / `Install Sileo and start SSH on this iPhone.` / `Preparing system services...` / `Preparing execution...` / `Escaping sandbox...` / `With <3 from Calif.io(@lambda, @dion, @black, @stefan)` |
| 20–35s | 18:48 | apt 装包 | `Get:5 http://127.0.0.1:2234 stable/main iphoneos-arm64-native chollima-sileo ... 2.5.1+chollima50 [9635 kB]` / `Get:7 ... firmware iphoneos-arm64 27.0.1 [700 B]` / `Fetched 9957 kB in 1s (13.5 MB/s)` / `(Reading database ... 3823 files and directories currently installed.)` / `Unpacking chollima-native-runtime (2.9+chollima1)` / `Unpacking libchollima1:iphoneos-arm64-native (1.2+chollima2.1)` / `Unpacking chollima-applications (1.38+chollima1)` / `Unpacking chollima-shell-tools (1.2)` |
| 36–45s | 18:49 | Sileo 就绪 + Mac 连 SSH | `Sileo and SSH are ready` / `ssh -p 2222 root@192.168.1.132` / `ECDSA key fingerprint is: SHA256:KpBuJx50uv0xlWVEvqQidH3bRLoGjXQix2UN1v9S6Ug` / `Warning: Permanently added '[192.168.1.132]:2222' (ECDSA)` / `root@192.168.1.132's password:` / `bash: cannot set terminal process group (1): Inappropriate ioctl for device` / `bash: no job control in this shell` |
| 40–50s | 18:49 | root 证据三连 | `iphone# id` → `uid=0 gid=0(wheel) groups=0(wheel)`；`iphone# uname -a` → `Darwin localhost 27.0.0 Darwin Kernel Version 27.0.0: Thu Aug 13 21:41:52 PDT 2026; root:xnu-13432.2.10~2/RELEASE_ARM64_T8160 iPhone19,2 arm Darwin` |
| 50–60s | 18:49 | neofetch | `OS: iOS 27.0.1` / `Host: iPhone 18 Pro` / `Kernel: 27.0.0` / **`Uptime: 2 mins`** / `Packages: 67 (dpkg)` / `Shell: bash 5.2.21` / **`Terminal: launchd`** / `CPU: Apple (6)` |
| 75–85s | 18:49 | sw_vers | `ProductName: iPhone OS` / `ProductVersion: 27.0.1` / `BuildVersion: 24A446` |
| 86–91s | 18:50 | 锁屏 | 结束 |

## 2. 这台终端到底在做什么

**它不是漏洞利用界面，而是越狱完成后的“用户态出口 + 证据”。**

1. **本地 apt 源**：`http://127.0.0.1:2234 stable/main`，架构名 `iphoneos-arm64-native`。源跑在设备自己的回环地址上，所以 13.5 MB/s 是内存/回环速度，说明 deb 由 App 内置或本地守护进程提供，全程不需要外网。
2. **dpkg bootstrap**：`(Reading database ... 3823 files ...)` 表明设备上已经有可用的 dpkg 数据库，装的是 `chollima-native-runtime`、`libchollima1`、`chollima-applications`、`chollima-shell-tools`、`chollima-ssh`、`chollima-sileo`、`firmware 27.0.1` —— 典型的 Procursus 风格伪根（rootless/rootful 混合的私有布局）。
3. **sshd**：`chollima-ssh 1.2.4` 装完后 App 提示 `Sileo and SSH are ready`，Mac 立刻能 `ssh -p 2222 root@192.168.1.132`（**2222 端口、密码认证**，非 22）。
4. **三个证据命令**：`id`（uid=0）、`uname -a`（内核 27.0.0 / xnu-13432.2.10~2 / T8160 / iPhone19,2）、`sw_vers`（27.0.1 / 24A446）。这三条只证明“我有 root、这是什么机器、什么系统”，与利用手法无关。
5. **两条被忽略但信息量最大的线索**：
   - `bash: cannot set terminal process group (1): Inappropriate ioctl for device` + `no job control` → sshd 的会话没有真正的 controlling tty，bootstrap 是手工拼的，不是完整发行版；
   - neofetch `Terminal: launchd` → 这条会话由 **launchd 拉起**的守护进程派生，即这套东西是**以 launchd job 形式常驻**的。
6. **Uptime: 2 mins**：SSH 可用时系统才启动 2 分钟，且此前有重启动作（18:46 设置 → 18:47 之后启动）。这就是“重启后仍能拿到 root shell”的量化证据。

## 3. 从证据反推利用链（推断，非官方口径）

已确证的事实：iPhone 18 Pro（T8160/A20 Pro）· iOS 27.0.1 (24A446) · 内核 xnu-13432.2.10~2 · 沙盒逃逸是 App 自己声明的阶段 · 有 dpkg + launchd 级 root · 重启后 2 分钟内 SSH 可用 · 官方称首次绕过 MIE（iPhone 17 起启用，基于 ARM EMTE）。

链条至少四段，缺一不可：

1. **初始执行**：App 内点击 Start 即触发（另一条视频是 iMessage/Signal 的 PDF 一键）。→ 说明存在**应用内可用的提权原语**，或 App 本身带特殊签名/授权，能与系统服务对话。
2. **沙盒逃逸**：App 界面直接写着 `Escaping sandbox...`。→ 候选：某个 `com.apple.*` XPC 服务的输入校验缺陷、共享内存（IOSurface/IOKit）越界、或媒体/图形栈的跨进程攻击面。
3. **内核 r/w（绕 MIE/EMTE）**：在 EMTE 下伪造指针基本不可行，现实只有三条路：
   - **MTE 未覆盖的映射**：IOKit 共享内存、GPU/固件邮箱、DMA 缓冲区等不走 tag 检查的区域；
   - **data-only 攻击**：不伪造指针，改标志位/长度/凭据结构（`kauth_cred`、`cs_blob`、`proc_ro` 一类）；
   - **标签管理逻辑缺陷**：tag 的存取/复制时机错位。
   官方“首个绕过 MIE”的表述，最符合 (a) 或 (b)。
4. **让 launchd 加载非 Apple 签名代码 + 持久化**：`Terminal: launchd` + 重启 2 分钟内可用 + 装了 LaunchDaemon 级服务 → 必须做到「内核层关掉/绕过代码签名校验」或「往 launchd 会扫描的可写路径塞 job」。SSV 封着系统卷，所以持久化点大概率在 **preboot** 一类可写且被信任的卷，由开机流程重新挂载/加载。

**无法从视频推断的**：具体 CVE 编号、具体函数、具体原语类型。Calif 只说“一串已报给 Apple 的漏洞”，且 27.2 beta 已修掉大部分；opa334 也公开说 27.2b3 上那条 root 链已被 Apple 修掉、因此保持私有。

## 4. 一个必须说清的时序问题

这段视频里：18:47 重启 → 18:48 **手动点了 Start** → 18:49 SSH 成功（uptime 2 分钟）。

也就是说，**单独看这段片子，不能证明“重启后无需任何操作”**——它证明的是 bootstrap + root shell 可用。真正的 untether 证据在另一条名为 “iPhone 18 Pro Persistent Jailbreak” 的视频里（重启 → 输密码解锁 → 越狱状态自恢复 → 无电脑开 root SSH）。两段要合起来看，别混为一谈。
