import { fetchJson, fetchText } from '../../utils/fetchData';
import { SubjectTypeId } from '../../interface/wiki';
import { sendForm, sendFormImg } from '../../utils/ajax';

export function getBgmHost() {
  return `${location.protocol}//${location.host}`;
}
export function getSubjectId(url: string) {
  const m = url.match(/(?:subject|character)\/(\d+)/);
  if (!m) return '';
  return m[1];
}
export async function getFormhash() {
  const rawText = await fetchText(
    `${location.protocol}//${location.host}/new_subject/1`
  );
  let $doc = new DOMParser().parseFromString(rawText, 'text/html');
  let formhash = $doc
    .querySelector('input[name=formhash]')
    .getAttribute('value');
  return formhash;
}
export async function uploadSubjectCover(
  subjectId: string,
  dataUrl: string,
  bgmHost: string = ''
) {
  if (!bgmHost) {
    bgmHost = `${location.protocol}//${location.host}`;
  }
  const url = `${bgmHost}/subject/${subjectId}/upload_img`;
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const $form = $doc.querySelector('form[name=img_upload') as HTMLFormElement;
  await sendFormImg($form, dataUrl);
}

export async function searchCVByName(name: string) {
  const bgmHost = getBgmHost();
  const url = `${bgmHost}/json/search-cv_person/${name}`;
  const res = await fetchJson(url, 'json');
  return Object.keys(res)[0];
}

// 添加角色的关联条目
export async function addPersonRelatedSubject(
  subjectIds: string[],
  charaId: string,
  typeId: SubjectTypeId,
  charaType: number = 1
) {
  const typeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = typeDict[typeId];
  const url = `${bgmHost}/character/${charaId}/add_related/${type}`;
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const $form = $doc.querySelector('.mainWrapper form') as HTMLFormElement;
  const extroInfo: any = [];
  // 1 主角 2 配角 3 客串
  subjectIds.forEach((v, i) => {
    extroInfo.push({
      name: `infoArr[n${i}][crt_type]`,
      value: charaType,
    });
    extroInfo.push({
      name: `infoArr[n${i}][subject_id]`,
      value: v,
    });
  });
  // {name: 'submit', value: '保存关联数据'}
  await sendForm($form, [...extroInfo]);
}

// 未设置域名的兼容，只能在 Bangumi 本身上面使用
// 添加角色的关联 CV
export async function addPersonRelatedCV(
  subjectId: string,
  charaId: string,
  personIds: string[],
  typeId: SubjectTypeId
) {
  const typeDict = {
    [SubjectTypeId.game]: 'game',
    [SubjectTypeId.anime]: 'anime',
    [SubjectTypeId.music]: 'music',
    [SubjectTypeId.book]: 'book',
    [SubjectTypeId.real]: 'real',
    [SubjectTypeId.all]: 'all',
  };
  const bgmHost = `${location.protocol}//${location.host}`;
  const type = typeDict[typeId];
  const url = `${bgmHost}/character/${charaId}/add_related/person/${type}`;
  const rawText = await fetchText(url);
  const $doc = new DOMParser().parseFromString(rawText, 'text/html');
  const $form = $doc.querySelector('.mainWrapper form') as HTMLFormElement;
  const personInfo = personIds.map((v, i) => ({
    name: `infoArr[n${i}][prsn_id]`,
    value: v,
  }));
  // {name: 'submit', value: '保存关联数据'}
  await sendForm($form, [
    {
      name: 'infoArr[n0][subject_id]',
      value: subjectId,
    },
    {
      name: 'infoArr[n0][subject_type_id]',
      value: typeId,
    },
    ...personInfo,
  ]);
}