/**
 * 系统工具类 - 处理跨平台的XMind应用检测和启动
 */

import { Platform } from 'obsidian';

// 桌面端专用功能的声明
declare global {
  interface Window {
    require?: (module: string) => any;
    process?: {
      platform: string;
      env: { [key: string]: string | undefined };
    };
  }
}

// 检查是否有文件系统访问权限（桌面端专用）
const hasFileSystemAccess = (): boolean => {
  return Platform.isDesktop && typeof window !== 'undefined' && window.require;
};

// 安全的文件系统操作包装器
const safeFileExists = async (filePath: string): Promise<boolean> => {
  if (!hasFileSystemAccess()) {
    return false;
  }
  
  try {
    const fs = window.require!('fs');
    return fs.existsSync(filePath);
  } catch (error) {
    console.warn('文件系统访问失败:', error);
    return false;
  }
};

// 安全的路径操作包装器
const safePath = {
  join: (...paths: string[]): string => {
    if (hasFileSystemAccess()) {
      try {
        const path = window.require!('path');
        return path.join(...paths);
      } catch (error) {
        console.warn('路径操作失败:', error);
      }
    }
    // 备用的简单路径连接（移动端）
    return paths.join('/').replace(/\/+/g, '/');
  }
};

const getElectronShell = () => {
  try {
    // 尝试获取 Electron 的 shell API
    if (typeof window !== 'undefined' && window.require) {
      return window.require('electron').shell;
    }
  } catch (error) {
    console.warn('无法获取 Electron shell API:', error);
  }
  return null;
};

const execAsync = async (command: string): Promise<{ stdout: string; stderr: string }> => {
  if (!hasFileSystemAccess()) {
    throw new Error('系统命令执行不可用（移动端不支持）');
  }
  
  try {
    const { promisify } = window.require!('util');
    const { exec } = window.require!('child_process');
    const execPromise = promisify(exec);
    return await execPromise(command);
  } catch (error) {
    console.warn('无法执行系统命令:', error);
    throw new Error('系统命令执行失败');
  }
};

export interface SystemInfo {
  platform: 'darwin' | 'win32' | 'linux';
  platformName: string;
}

export interface XMindAppInfo {
  found: boolean;
  path?: string;
  version?: string;
  executablePath?: string;
}

/**
 * 系统检测和XMind应用管理工具
 */
export class SystemUtils {
  
  /**
   * 获取系统信息
   */
  static getSystemInfo(): SystemInfo {
    const platform = Platform.isMacOS ? 'darwin' : 
                    Platform.isWin ? 'win32' : 'linux';
    
    const platformName = Platform.isMacOS ? 'macOS' : 
                        Platform.isWin ? 'Windows' : 'Linux';
    
    return { platform, platformName };
  }

  /**
   * 检测XMind应用是否已安装
   */
  static async detectXMindApp(): Promise<XMindAppInfo> {
    // 移动端不支持 XMind 应用检测
    if (!Platform.isDesktop) {
      return { found: false };
    }

    const { platform } = this.getSystemInfo();
    
    switch (platform) {
      case 'darwin':
        return this.detectXMindOnMacOS();
      case 'win32':
        return this.detectXMindOnWindows();
      case 'linux':
        return this.detectXMindOnLinux();
      default:
        return { found: false };
    }
  }

  /**
   * macOS 上检测 XMind 应用
   */
  private static async detectXMindOnMacOS(): Promise<XMindAppInfo> {
    const possiblePaths = [
      '/Applications/XMind.app',
      '/Applications/XMind 2020.app',
      '/Applications/XMind 2021.app',
      '/Applications/XMind 2022.app',
      '/Applications/XMind 2023.app',
      '/Applications/XMind 2024.app',
      '/Applications/XMind 8.app',
      '~/Applications/XMind.app',
      '~/Applications/XMind 2020.app',
      '~/Applications/XMind 2021.app',
      '~/Applications/XMind 2022.app',
      '~/Applications/XMind 2023.app',
      '~/Applications/XMind 2024.app',
      '~/Applications/XMind 8.app'
    ];

    for (const appPath of possiblePaths) {
      const resolvedPath = appPath.startsWith('~') ? 
        safePath.join(window.process?.env.HOME || '', appPath.slice(2)) : appPath;
      
      if (await safeFileExists(resolvedPath)) {
        try {
          // 简化版本检测，避免复杂的命令行调用
          let version = 'Detected';
          
          // 尝试从应用路径推断版本
          if (resolvedPath.includes('2024')) version = '2024';
          else if (resolvedPath.includes('2023')) version = '2023';
          else if (resolvedPath.includes('2022')) version = '2022';
          else if (resolvedPath.includes('2021')) version = '2021';
          else if (resolvedPath.includes('2020')) version = '2020';
          else if (resolvedPath.includes('8')) version = '8';

          return {
            found: true,
            path: resolvedPath,
            version,
            executablePath: resolvedPath
          };
        } catch (error) {
          console.warn('检测XMind应用时出错:', error);
        }
      }
    }

    return { found: false };
  }

  /**
   * Windows 上检测 XMind 应用
   */
  private static async detectXMindOnWindows(): Promise<XMindAppInfo> {
    const possiblePaths = [
      'C:\\Program Files\\XMind\\XMind.exe',
      'C:\\Program Files (x86)\\XMind\\XMind.exe',
      'C:\\Program Files\\XMind 2020\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 2020\\XMind.exe',
      'C:\\Program Files\\XMind 2021\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 2021\\XMind.exe',
      'C:\\Program Files\\XMind 2022\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 2022\\XMind.exe',
      'C:\\Program Files\\XMind 2023\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 2023\\XMind.exe',
      'C:\\Program Files\\XMind 2024\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 2024\\XMind.exe',
      'C:\\Program Files\\XMind 8\\XMind.exe',
      'C:\\Program Files (x86)\\XMind 8\\XMind.exe'
    ];

    for (const exePath of possiblePaths) {
      if (await safeFileExists(exePath)) {
        try {
          // 简化版本检测，从路径推断
          let version = 'Detected';
          if (exePath.includes('2024')) version = '2024';
          else if (exePath.includes('2023')) version = '2023';
          else if (exePath.includes('2022')) version = '2022';
          else if (exePath.includes('2021')) version = '2021';
          else if (exePath.includes('2020')) version = '2020';
          else if (exePath.includes('8')) version = '8';

          return {
            found: true,
            path: exePath,
            version,
            executablePath: exePath
          };
        } catch (error) {
          console.warn('检测XMind应用时出错:', error);
        }
      }
    }

    // 跳过复杂的注册表检测，简化实现

    return { found: false };
  }

  /**
   * Linux 上检测 XMind 应用
   */
  private static async detectXMindOnLinux(): Promise<XMindAppInfo> {
    const possibleCommands = ['xmind', 'xmind-2020', 'xmind-2021', 'xmind-2022', 'xmind-2023', 'xmind-2024', 'xmind8'];
    
    // 简化命令检测，主要依靠文件系统检测

    // 检查常见安装路径
    const possiblePaths = [
      '/usr/bin/xmind',
      '/usr/local/bin/xmind',
      '/opt/xmind/xmind',
      '/opt/XMind/xmind',
      '/snap/bin/xmind',
      `${window.process?.env.HOME}/.local/bin/xmind`
    ];

    for (const exePath of possiblePaths) {
      if (await safeFileExists(exePath)) {
        // 从路径推断版本
        let version = 'System';
        if (exePath.includes('2024')) version = '2024';
        else if (exePath.includes('2023')) version = '2023';
        else if (exePath.includes('2022')) version = '2022';
        else if (exePath.includes('2021')) version = '2021';
        else if (exePath.includes('2020')) version = '2020';
        else if (exePath.includes('8')) version = '8';
        
        return {
          found: true,
          path: exePath,
          version,
          executablePath: exePath
        };
      }
    }

    return { found: false };
  }

  /**
   * 使用XMind应用打开文件
   */
  static async openWithXMind(filePath: string): Promise<boolean> {
    // 移动端不支持外部应用启动
    if (!Platform.isDesktop) {
      return false;
    }

    const xmindApp = await this.detectXMindApp();
    
    if (!xmindApp.found || !xmindApp.executablePath) {
      return false;
    }

    const { platform } = this.getSystemInfo();
    
    try {
      // 尝试使用 Electron shell API
      const shell = getElectronShell();
      if (shell && shell.openPath) {
        await shell.openPath(filePath);
        return true;
      }

      // 备选方案：使用命令行
      switch (platform) {
        case 'darwin':
          await execAsync(`open -a "${xmindApp.path}" "${filePath}"`);
          return true;
          
        case 'win32':
          await execAsync(`"${xmindApp.executablePath}" "${filePath}"`);
          return true;
          
        case 'linux':
          await execAsync(`"${xmindApp.executablePath}" "${filePath}"`);
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('使用XMind打开文件失败:', error);
      return false;
    }
  }

  /**
   * 获取XMind应用的用户友好描述
   */
  static getXMindAppDescription(appInfo: XMindAppInfo): string {
    if (!appInfo.found) {
      return 'XMind应用未安装';
    }

    const version = appInfo.version && appInfo.version !== 'Unknown' ? 
      ` (${appInfo.version})` : '';
    
    return `XMind${version}`;
  }
}