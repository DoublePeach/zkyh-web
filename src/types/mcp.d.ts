/**
 * @description Model Context Protocol SDK 类型声明
 * @author 郝桃桃
 * @date 2024-08-24
 */

declare module '@modelcontextprotocol/sdk/client/index.js' {
  export interface Tool {
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  }
  
  export interface ClientOptions {
    name: string;
    version: string;
  }
  
  export class Client {
    constructor(options: ClientOptions);
    
    connect(transport: any): Promise<void>;
    
    listTools(): Promise<Tool[]>;
    
    invoke(toolName: string, params: Record<string, any>): Promise<any>;
    
    close(): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/client/streamableHttp.js' {
  export class StreamableHTTPClientTransport {
    constructor(serverUrl: string);
  }
} 