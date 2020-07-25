import {SingleInfo, SubjectWikiInfo} from "../../interface/subject";
import {$q, $qa} from "../../utils/domUtils";
import {sleep} from "../../utils/async/sleep";
import {dealDate} from "../../utils/utils";
import {dealImageWidget} from "./dealImageWidget";

/**
 * 转换 wiki 模式下 infobox 内容
 * @param originValue
 * @param infoArr
 */
export function convertInfoValue(originValue: string, infoArr: SingleInfo[])
  : string {
  const arr = originValue.trim().split('\n').filter(v => !!v);
  const newArr = [];
  for (const info of infoArr) {
    let isDefault = false;
    for (let i = 0, len = arr.length; i < len; i++) {
      //  |发行日期=  ---> 发行日期
      // [纯假名|] ---> 纯假名
      const m = arr[i].match(/(?:\||\[)(.+?)([|=])/)
      if (!m || m.length < 2) continue;
      const n = m[1];
      if (n === info.name) {
        let d = info.value;
        // 处理时间格式
        if (info.category === 'date') {
          d = dealDate(d);
        }
        // 匹配到 [英文名|]
        if (/\[.+\|\]/.test(arr[i])) {
          arr[i] = arr[i].replace(']', '') + d + ']'
        } else if (/\|.+={/.test(arr[i])) {
          // |平台={
          arr[i] = `${arr[i]}\n[${info.value}]`
        } else {
          // 拼接： |发行日期=2020-01-01
          arr[i] = arr[i].replace(/=[^{[]+/, '=') + d;
        }
        isDefault = true;
        break;
      }
    }
    // 抹去 asin 2020/7/26
    if (!isDefault && info.name && !['asin', 'ASIN'].includes(info.name)) {
      newArr.push(`|${info.name}=${info.value}`);
    }
  }
  arr.pop();
  return [...arr, ...newArr, '}}'].join('\n')
}

function observerNode($node: HTMLElement): Promise<any> {
  return new Promise<any>(resolve => {
    const config = {attributes: true, childList: true, subtree: true};
    const observer = new MutationObserver((mutationsList) => {
      observer.disconnect()
      resolve(mutationsList)
    });
    observer.observe($node, config);
  })
}

/**
 * 填写 wiki 表单
 * TODO: 使用 MutationObserver 实现
 * @param wikiData
 */
export async function fillInfoBox(wikiData: SubjectWikiInfo) {
  const dict = {
    '誕生日': '生日',
    'スリーサイズ': 'BWH'
  } as any;
  const {infos} = wikiData;
  const subType = +wikiData.subtype
  const infoArray: SingleInfo[] = [];
  const $typeInput: NodeList = $qa('table tr:nth-of-type(2) > td:nth-of-type(2) input');
  if ($typeInput) {
    // @ts-ignore
    $typeInput[0].click();
    if (!isNaN(subType)) {
      // @ts-ignore
      $typeInput[subType].click();
    }
  }
  await sleep(100);

  const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]') as HTMLElement;
  const $newbieMode = $q('table small a:nth-of-type(2)[href="javascript:void(0)"]') as HTMLElement;
  for (let i = 0, len = infos.length; i < len; i++) {
    if (infos[i].category === 'subject_title') {
      let $title = $q('input[name=subject_title]') as HTMLInputElement;
      $title.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'subject_summary') {
      let $summary = $q('#subject_summary') as HTMLInputElement;
      $summary.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'crt_summary') {
      let $t = $q('#crt_summary') as HTMLInputElement;
      $t.value = (infos[i].value || '').trim();
      continue;
    }
    if (infos[i].category === 'crt_name') {
      let $t = $q('#crt_name') as HTMLInputElement;
      $t.value = (infos[i].value || '').trim();
      continue;
    }
    // 有名称并且category不在特定列表里面
    if (infos[i].name && ['cover', 'crt_cover'].indexOf(infos[i].category) === -1) {
      const name = infos[i].name;
      if (dict.hasOwnProperty(name)) {
        infoArray.push({
          ...infos[i],
          name: dict[name]
        })
      } else {
        infoArray.push(infos[i]);
      }
    }
  }
  $wikiMode.click();
  await sleep(200)
  const $infoBox = $q('#subject_infobox') as HTMLTextAreaElement
  $infoBox.value = convertInfoValue($infoBox.value, infoArray);
  await sleep(200);
  $newbieMode.click();
}

/**
 * 插入控制填表的按钮
 * @param $t 插入按钮的父元素
 * @param cb 填表回调
 * @param cancelCb 清空表单回调
 */
export function insertFillFormBtn(
  $t: Element,
  cb: (...args: any) => any,
  cancelCb: (...args: any) => any,
) {
  // 存在节点后，不再插入
  const clx = 'e-wiki-fill-form';
  if ($qa('.'+clx).length >= 2) return;
  const $s = document.createElement('span');
  $s.classList.add(clx);
  $s.innerHTML = 'wiki 填表';
  $t.appendChild($s);
  $s.addEventListener('click', cb);

  const $cancel = $s.cloneNode() as HTMLElement;
  $cancel.innerHTML = '清空';
  $cancel.classList.add(clx+'-cancel');
  $cancel.addEventListener('click', cancelCb)
  $t.appendChild($cancel);
}

export function initNewSubject(wikiInfo: SubjectWikiInfo) {
  const $t = $q('form[name=create_subject] [name=subject_title]').parentElement
  const defaultVal = ($q('#subject_infobox') as HTMLTextAreaElement).value;
  insertFillFormBtn(
    $t,
    async (e) => {
      await fillInfoBox(wikiInfo)
    },
    () => {
      // 清除默认值
      $qa('input[name=platform]').forEach(element => {
        (element as HTMLInputElement).checked = false;
      });
      const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]') as HTMLElement;
      $wikiMode.click();
      // @ts-ignore
      $q('#subject_infobox').value = defaultVal;
      // @ts-ignore
      $q('#columnInSubjectA [name=subject_title]').value = '';
      // @ts-ignore
      $q('#subject_summary').value = '';
    }
  )
}

export function initNewCharacter(wikiInfo: SubjectWikiInfo) {
  const $t = $q('form[name=new_character] #crt_name').parentElement
  const defaultVal = ($q('#subject_infobox') as HTMLTextAreaElement).value;
  insertFillFormBtn(
    $t,
    async (e) => {
      await fillInfoBox(wikiInfo)
    },
    () => {
      const $wikiMode = $q('table small a:nth-of-type(1)[href="javascript:void(0)"]') as HTMLElement;
      $wikiMode.click();
      // @ts-ignore
      $q('#subject_infobox').value = defaultVal;
      // @ts-ignore
      $q('#columnInSubjectA #crt_name').value = '';
      // @ts-ignore
      $q('#crt_summary').value = '';
    }
  )
  const coverInfo = wikiInfo.infos
    .filter((item: SingleInfo) => item.category === 'crt_cover')[0]
  if (coverInfo && coverInfo.value && coverInfo.value.match(/^data:image/)) {
    dealImageWidget($q('form[name=new_character]'), coverInfo.value)
    // 修改文本
    setTimeout(() => {
      const $input = $q('.e-wiki-cover-container [name=submit]') as HTMLInputElement;
      if ($input) {
        $input.value = '添加人物并上传肖像';
      }
    }, 200)
  }
}

export function initUploadImg(wikiInfo: SubjectWikiInfo) {
  const coverInfo = wikiInfo.infos.filter((item: SingleInfo) => item.category === 'cover')[0]
  if (coverInfo && coverInfo.value && coverInfo.value.dataUrl) {
    dealImageWidget($q('form[name=img_upload]'), coverInfo.value.dataUrl)
  }
}
