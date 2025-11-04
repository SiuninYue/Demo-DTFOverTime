- 环境说明（请严格遵守）

我在 Windows 11 + WSL2 (Ubuntu 22.04)。

所有命令用 bash/Linux；包用 apt、pip/uv、npm/pnpm（不要 PowerShell/Chocolatey）。

路径样式：/home/yue/project，LF 换行。

端口默认在 localhost 暴露给 Windows 浏览器。

项目放在 WSL 文件系统，不在 /mnt/c。

若需原生依赖，请给出 apt 安装清单与 build-essential 等前置依赖。