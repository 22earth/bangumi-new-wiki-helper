// @ts-ignore
import browser from 'webextension-polyfill';
import { SingleInfo, SubjectWikiInfo } from '../interface/subject';
import { InfoConfig, SiteConfig } from '../interface/wiki';
import { getCharaModel } from '../models';
import { addCharaUI, getCharaData } from '../sites/common';
import { findAllElement, findElement } from '../utils/domUtils';

export async function initChara(siteConfig: SiteConfig) {
  // 查找标志性的元素
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const charaModel = getCharaModel(siteConfig.key);
  if (!charaModel) return;
  const $el = findElement(charaModel.controlSelector);
  if (!$el) return;
  const itemArr = findAllElement(charaModel.itemSelector);
  // 获取名字列表
  const names = await Promise.all(
    itemArr.map(async ($t) => {
      const nameConfig: InfoConfig = charaModel.itemList.find(
        (item) => item.category == 'crt_name'
      );
      const nameInfo: SingleInfo[] = await getCharaData(
        {
          ...charaModel,
          itemList: [nameConfig],
        },
        $t
      );
      return nameInfo[0]?.value;
    })
  );
  addCharaUI($el, names, async (e: Event, val: string) => {
    let targetList: Element[] = [];
    if (val === 'all') {
      // @TODO 一次性新建全部
      // targetList = [...itemArr];
    } else {
      const idx = names.indexOf(val);
      if (idx !== -1) {
        targetList = itemArr.slice(idx, idx + 1);
      }
    }
    for (const $target of targetList) {
      const charaInfo: SingleInfo[] = await getCharaData(charaModel, $target);
      console.info('character info list: ', charaInfo);
      const charaData: SubjectWikiInfo = {
        type: siteConfig.type,
        infos: charaInfo,
      };
      await browser.storage.local.set({
        charaData,
      });
      await browser.runtime.sendMessage({
        action: 'create_new_character',
      });
    }
  });
}
