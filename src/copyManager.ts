import { Notice } from 'obsidian';

export class CopyManager {
    private static cleanupHtml(html: string): string {
        // 创建一个临时的 div 元素来处理 HTML
        const tempDiv = document.createElement('div');
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        tempDiv.append(...Array.from(doc.body.childNodes));

        // 移除所有的 data-* 属性
        tempDiv.querySelectorAll('*').forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        // 移除所有的 class 属性
        tempDiv.querySelectorAll('*').forEach(el => {
            el.removeAttribute('class');
        });

        // 移除所有的 id 属性
        tempDiv.querySelectorAll('*').forEach(el => {
            el.removeAttribute('id');
        });

        return tempDiv.innerHTML;
    }

    private static async processImages(container: HTMLElement): Promise<void> {
        const images = container.querySelectorAll('img');
        const imageArray = Array.from(images);
        
        for (const img of imageArray) {
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onload = () => {
                        img.src = reader.result as string;
                        resolve(null);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('图片转换失败:', error);
            }
        }
    }

    public static async copyToClipboard(element: HTMLElement): Promise<void> {
        try {
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            
            // 使用 cloneNode 复制内容
            const clone = element.cloneNode(true);
            container.append(clone);
            document.body.appendChild(container);
            
            // 处理图片转换为 base64
            await this.processImages(container);

            // 清理 HTML
            const cleanHtml = this.cleanupHtml(container.innerHTML);
            
            // 创建剪贴板数据
            const clipData = new ClipboardItem({
                'text/html': new Blob([cleanHtml], { type: 'text/html' }),
                'text/plain': new Blob([container.textContent || ''], { type: 'text/plain' })
            });

            document.body.removeChild(container);
            await navigator.clipboard.write([clipData]);
            
            new Notice('已复制到剪贴板');
        } catch (error) {
            new Notice('复制失败');
        }
    }
}