import {SiteConfig} from "../interface/wiki";
import {findElement} from "../utils/domUtils";
import {getQueryInfo, getWikiItem, insertControlBtn} from "../sites/common";
import {SingleInfo, SubjectWikiInfo} from "../interface/subject";
import {checkSubjectExit} from "../sites/bangumi";
import {AUTO_FILL_FORM, BGM_DOMAIN, PROTOCOL, WIKI_DATA} from "./constraints";


const getData = async (list: Promise<any>[]) => {
  return await Promise.all(list)
}

export async function initCommon(siteConfig: SiteConfig, subtype = 0) {
  const $page = findElement(siteConfig.pageSelectors);
  if (!$page) return;
  const $title = findElement(siteConfig.controlSelector);
  if (!$title) return;
  insertControlBtn($title.parentElement, async (e, flag) => {
    const protocol = GM_getValue(PROTOCOL) || 'https';
    const bgm_domain = GM_getValue(BGM_DOMAIN) || 'bgm.tv';
    const bgmHost = `${protocol}://${bgm_domain}`
    console.info('init')
    // getWikiItem promise
    const rawList = await getData(siteConfig.itemList.map(item => getWikiItem(item, siteConfig.key)));
    const infoList: SingleInfo[] = rawList.filter(i => i)
    console.info('wiki info list: ', infoList)
    const wikiData: SubjectWikiInfo = {
      type: siteConfig.type,
      subtype,
      infos: infoList
    }
    GM_setValue(WIKI_DATA, JSON.stringify(wikiData))
    if (flag) {
      const result = await checkSubjectExit(
        getQueryInfo(infoList),
        bgmHost,
        wikiData.type,
      );
      console.info('search results: ', result)
      if (result && result.url) {
        GM_openInTab(bgmHost + result.url)
      } else {
        // 重置自动填表
        GM_setValue(AUTO_FILL_FORM, 1);
        GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`)
      }
    } else {
      // 重置自动填表
      GM_setValue(AUTO_FILL_FORM, 1);
      GM_openInTab(`${bgmHost}/new_subject/${wikiData.type}`)
    }
  });
}

export function addStyle() {
  GM_addStyle(`
.e-wiki-new-character, .e-wiki-new-subject, .e-wiki-search-subject, .e-wiki-fill-form {
  color: rgb(0, 180, 30) !important;
  margin-left: 4px !important;
}

.e-wiki-new-subject {
  margin-left: 8px;
}

.e-wiki-new-character:hover,
.e-wiki-new-subject:hover,
.e-wiki-search-subject:hover,
.e-wiki-fill-form:hover {
  color: red !important;
  cursor: pointer;
}

/* upload img */
.e-wiki-cover-container {
  margin-top: 1rem;
}

.e-wiki-cover-container img {
  display: none;
}

#e-wiki-cover-amount {
  padding-left: 10px;
  border: 0;
  color: #f6931f;
  font-size: 20px;
  font-weight: bold;
}

#e-wiki-cover-reset {
  display: inline-block;
  text-align: center;
  width: 60px;
  height: 30px;
  line-height: 30px;
  font-size: 18px;
  background-color: #f09199;
  text-decoration: none;
  color: #fff;
  margin-left: 50px;
  margin-bottom: 30px;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #333;
}

#e-wiki-cover-preview {
  margin-top: 0.5rem;
}

#e-wiki-cover-preview:active {
  cursor: crosshair;
}

#e-wiki-cover-preview {
  display: block;
}

.e-wiki-cover-blur-loading {
  width: 208px;
  height: 13px;
  background-image: url("https://bgm.tv/img/loadingAnimation.gif");
}

.e-wiki-search-cover {
  width: 84px;
  height: auto;
}
  `)
}
