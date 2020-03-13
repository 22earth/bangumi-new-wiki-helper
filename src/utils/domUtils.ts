/**
 * 为页面添加样式
 * @param style
 */
import {ResourceItem, Selector} from "../interface/wiki";

export const addStyle = (style: string) => {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
};

function getText(elem: HTMLElement): string {
  return (elem.textContent || elem.innerText || '')
}

/**
 * dollar 选择单个
 * @param {string} selector
 */
export function $q(selector: string): Element {
  return document.querySelector(selector);
}

/**
 * dollar 选择所有元素
 * @param {string} selector
 */
export function $qa<E extends Element>(selector: string): NodeListOf<E> {
  return document.querySelectorAll(selector);
}

/**
 * 插入自执行的函数的脚本
 * @param fn 回调函数
 * @param data 数据
 */
export function injectScript(fn: Function, data: Object) {
  const script = document.createElement("script");
  script.innerHTML = `(${fn.toString()})(${data});`;
  document.body.appendChild(script);
}

/**
 * 查找包含文本的标签
 * @param {string} selector
 * @param {string} text
 */
export function contains(selector: string, text: string | string[], $parent: HTMLElement) {
  let elements;
  if ($parent) {
    elements = $parent.querySelectorAll(selector);
  } else {
    elements = $qa(selector);
  }
  let t: string;
  if (typeof text === 'string') {
    t = text
  } else {
    t = text.join('|');
  }
  return [].filter.call(elements, function (element: HTMLElement) {
    return new RegExp(t).test(getText(element));
  });
}

/**
 * 插入控制的按钮
 * @param $t 父节点
 * @param cb 返回 Promise 的回调
 */
export function insertControlBtn(
  $t: Element,
  cb: (...args: any) => Promise<any>) {
  const $s = document.createElement('span');
  $s.classList.add('e-wiki-new-subject');
  $s.innerHTML = '新建';
  const $search = $s.cloneNode() as Element;
  $search.innerHTML = '新建并查重';
  $t.appendChild($s);
  $t.appendChild($search);
  $s.addEventListener('click', cb);
  $search.addEventListener('click', async (e) => {
    if ($search.innerHTML !== '新建并查重') return;
    $search.innerHTML = '查重中...';
    await cb(e);
    $search.innerHTML = '新建并查重';
  });
}

function findElementByKeyWord(selector: Selector): Element {
  let res: Element;
  return res
}
export function findElement(selector: Selector | Selector[]) : Element {
  let r: Element
  if (selector instanceof Array) {
  } else {
    if (!selector.subSelector) {
      r = $q(selector.selector)
    } else {
      r = findElementByKeyWord(selector)
    }
  }
  return r
}
