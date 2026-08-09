"use client";
/* eslint-disable @next/next/no-img-element -- collected post images may be remote and should remain unmodified */

import { useMemo, useState, type CSSProperties } from "react";
import CityDiorama from "./city-diorama";
import ExploreBookingDemo from "./explore-booking-demo";
import styles from "./explore-sandbox.module.css";

export type ExploreSandboxCity = "西安" | "洛阳" | "延吉" | "杭州";

export type ExploreSandboxCase = {
  id?: string;
  city?: string;
  spot?: string;
  title?: string;
  shop?: string;
  price?: number | null;
  priceStatus?: string;
  image?: string;
  images?: readonly string[];
  storeAddress?: string;
  sourceUrl?: string;
  shopProfileUrl?: string;
  shopBookingEnabled?: boolean;
  storeLatitude?: number;
  storeLongitude?: number;
};

export type ExploreSandboxProps = {
  cases?: readonly ExploreSandboxCase[];
  initialCity?: ExploreSandboxCity;
  onCityChange?: (city: ExploreSandboxCity) => void;
  onOpenCase?: (caseId: string) => void;
  onRequestBooking?: (caseId: string, shopName: string) => void;
};

type ScenicPoint = {
  id: string;
  name: string;
  note: string;
  x: number;
  y: number;
};

type StorePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  placeholder: boolean;
  bookingEnabled: boolean;
  address?: string;
  price?: number;
  priceStatus?: string;
  sourceUrl?: string;
  profileUrl?: string;
  caseIds: string[];
  spots: string[];
  previews: { caseId: string; title: string; image?: string; spot?: string }[];
};

type Selection =
  | { kind: "spot"; id: string }
  | { kind: "store"; id: string };

type MarkerStyle = CSSProperties & { "--x": string; "--y": string };

const scenes: Record<ExploreSandboxCity, { subtitle: string; points: ScenicPoint[] }> = {
  西安: {
    subtitle: "城墙与盛唐夜游",
    points: [
      { id: "xa-night", name: "大唐不夜城", note: "打卡资料待补充", x: 30, y: 29 },
      { id: "xa-lotus", name: "大唐芙蓉园", note: "打卡资料待补充", x: 68, y: 47 },
      { id: "xa-bell", name: "钟楼", note: "打卡资料待补充", x: 43, y: 70 },
    ],
  },
  洛阳: {
    subtitle: "神都古城与宫阙",
    points: [
      { id: "ly-luoyi", name: "洛邑古城", note: "案例待采集", x: 27, y: 34 },
      { id: "ly-yingtian", name: "应天门", note: "案例待采集", x: 67, y: 43 },
      { id: "ly-jiuzhou", name: "九洲池", note: "案例待采集", x: 47, y: 72 },
    ],
  },
  延吉: {
    subtitle: "民族服饰与城市夜景",
    points: [
      { id: "yj-folk", name: "民俗园", note: "案例待采集", x: 29, y: 31 },
      { id: "yj-river", name: "布尔哈通河", note: "案例待采集", x: 69, y: 49 },
      { id: "yj-market", name: "西市场", note: "案例待采集", x: 44, y: 72 },
    ],
  },
  杭州: {
    subtitle: "湖山宋韵与江南街巷",
    points: [
      { id: "hz-westlake", name: "西湖", note: "案例待采集", x: 28, y: 36 },
      { id: "hz-lingyin", name: "灵隐寺", note: "案例待采集", x: 67, y: 31 },
      { id: "hz-hefang", name: "河坊街", note: "案例待采集", x: 51, y: 72 },
    ],
  },
};

const storePositions = [
  { x: 18, y: 57 },
  { x: 77, y: 66 },
  { x: 57, y: 23 },
  { x: 34, y: 82 },
  { x: 84, y: 35 },
  { x: 52, y: 56 },
];

function markerStyle(x: number, y: number): MarkerStyle {
  return { "--x": `${x}%`, "--y": `${y}%` };
}

function cleanImages(item: ExploreSandboxCase) {
  return [...new Set([item.image, ...(item.images ?? [])].filter((value): value is string => Boolean(value)))];
}

function isUsableShopName(name: string | undefined) {
  if (!name?.trim()) return false;
  return !/未明确|未提及|那家店|某家店|喜欢的那家|美食城里面|原帖.*方|待核实/.test(name);
}

function buildStores(city: ExploreSandboxCity, input: readonly ExploreSandboxCase[]): StorePoint[] {
  const grouped = new Map<string, StorePoint>();

  input
    .filter((item) => item.city === city && isUsableShopName(item.shop))
    .forEach((item, index) => {
      const name = item.shop!.trim();
      const existing = grouped.get(name);
      const position = storePositions[grouped.size % storePositions.length];
      const nextImages = cleanImages(item);
      const caseId = item.id?.trim();
      const preview = caseId ? { caseId, title: item.title || "真实游客案例", image: nextImages[0], spot: item.spot } : null;

      if (existing) {
        if (caseId && !existing.caseIds.includes(caseId)) existing.caseIds.push(caseId);
        if (item.spot && !existing.spots.includes(item.spot)) existing.spots.push(item.spot);
        if (preview && !existing.previews.some((entry) => entry.caseId === preview.caseId)) existing.previews.push(preview);
        if (!existing.address && item.storeAddress) existing.address = item.storeAddress;
        if (!existing.price && item.price) existing.price = item.price;
        if (!existing.priceStatus && item.priceStatus) existing.priceStatus = item.priceStatus;
        if (!existing.sourceUrl && item.sourceUrl) existing.sourceUrl = item.sourceUrl;
        if (!existing.profileUrl && item.shopProfileUrl) existing.profileUrl = item.shopProfileUrl;
        existing.bookingEnabled ||= item.shopBookingEnabled === true;
        return;
      }

      grouped.set(name, {
        id: `collected-${index}-${name}`,
        name,
        x: position.x,
        y: position.y,
        placeholder: false,
        bookingEnabled: item.shopBookingEnabled === true,
        address: item.storeAddress,
        price: item.price && item.price > 0 ? item.price : undefined,
        priceStatus: item.priceStatus,
        sourceUrl: item.sourceUrl,
        profileUrl: item.shopProfileUrl,
        caseIds: caseId ? [caseId] : [],
        spots: item.spot ? [item.spot] : [],
        previews: preview ? [preview] : [],
      });
    });

  if (grouped.size) return [...grouped.values()].slice(0, storePositions.length);

  return storePositions.slice(0, 3).map((position, index) => ({
    id: `placeholder-${city}-${index}`,
    name: `妆造店占位 ${String.fromCharCode(65 + index)}`,
    x: position.x,
    y: position.y,
    placeholder: true,
    bookingEnabled: false,
    caseIds: [],
    spots: [],
    previews: [],
  }));
}

function priceCopy(store: StorePoint) {
  if (!store.price) return { value: "价格待沟通", note: "尚未采集到可靠价格" };
  if (/merchant_confirmed|verified/i.test(store.priceStatus ?? "")) {
    return { value: `¥${store.price} 起`, note: "商家确认资料" };
  }
  if (/mentioned/i.test(store.priceStatus ?? "")) {
    return { value: `¥${store.price}`, note: "原帖提到 · 当前价格待确认" };
  }
  return { value: `¥${store.price}`, note: "采集参考 · 当前价格待确认" };
}

export function ExploreSandbox({
  cases = [],
  initialCity = "西安",
  onCityChange,
  onOpenCase,
  onRequestBooking,
}: ExploreSandboxProps) {
  const [city, setCity] = useState<ExploreSandboxCity>(initialCity);
  const [selection, setSelection] = useState<Selection>({ kind: "spot", id: scenes[initialCity].points[0].id });
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [dioramaSpot, setDioramaSpot] = useState<string>();
  const stores = useMemo(() => buildStores(city, cases), [cases, city]);
  const realStores = useMemo(() => stores.filter((store) => !store.placeholder), [stores]);
  const cityCases = useMemo(() => cases.filter((item) => item.city === city), [cases, city]);
  const selectedStore = selection.kind === "store" ? stores.find((store) => store.id === selection.id) : undefined;
  const selectedSpot = selection.kind === "spot" ? scenes[city].points.find((point) => point.id === selection.id) : undefined;
  const selectedPrice = selectedStore ? priceCopy(selectedStore) : null;

  function chooseCity(next: ExploreSandboxCity) {
    setCity(next);
    onCityChange?.(next);
    setSelection({ kind: "spot", id: scenes[next].points[0].id });
    setDioramaSpot(undefined);
    setGalleryOpen(false);
  }

  function chooseStore(store: StorePoint) {
    setSelection({ kind: "store", id: store.id });
    setGalleryOpen(false);
  }

  function openCase(caseId: string) {
    if (onOpenCase) onOpenCase(caseId);
    else window.dispatchEvent(new CustomEvent("lvzhuang-explore-case", { detail: caseId }));
  }

  function requestBooking(store: StorePoint) {
    const caseId = store.caseIds[0];
    if (caseId && onRequestBooking) onRequestBooking(caseId, store.name);
  }

  return (
    <section aria-labelledby="explore-sandbox-title" className={styles.shell}>
      <h1 className={styles.visuallyHidden} id="explore-sandbox-title">城市景点、妆造店铺与预约探索</h1>
      <CityDiorama
        onCityChange={chooseCity}
        onSpotChange={(spot) => {
          setDioramaSpot(spot);
          setGalleryOpen(false);
        }}
        selectedCity={city}
        selectedSpot={dioramaSpot}
      />

      <div aria-hidden="true" className={`${styles.mapCard} ${styles.legacyMap}`} hidden>
        <div className={styles.mapTopline}>
          <div>
            <span>{city} · 青绿造景</span>
            <strong>景点与妆造线索沙盘</strong>
          </div>
          <div className={styles.legend} aria-label="地图图例">
            <span><i className={styles.legendSpot} />景点</span>
            <span><i className={styles.legendStore} />店铺线索</span>
          </div>
        </div>

        <div aria-describedby="sandbox-map-note" aria-label={`${city}景点与妆造店分布示意沙盘`} className={styles.viewport}>
          <div aria-hidden="true" className={styles.terrain}>
            <i className={styles.ridgeOne} />
            <i className={styles.ridgeTwo} />
            <i className={styles.ridgeThree} />
            <i className={styles.water} />
            <i className={styles.routeOne} />
            <i className={styles.routeTwo} />
          </div>

          {scenes[city].points.map((point) => {
            const active = selection.kind === "spot" && selection.id === point.id;
            return (
              <button
                aria-label={`查看景点：${point.name}，位置为示意`}
                aria-pressed={active}
                className={`${styles.marker} ${styles.spotMarker} ${active ? styles.markerActive : ""}`}
                key={point.id}
                onClick={() => {
                  setSelection({ kind: "spot", id: point.id });
                  setGalleryOpen(false);
                }}
                style={markerStyle(point.x, point.y)}
                type="button"
              >
                <span>景</span>
                <b>{point.name}</b>
              </button>
            );
          })}

          {stores.map((store) => {
            const active = selection.kind === "store" && selection.id === store.id;
            return (
              <button
                aria-label={`查看${store.placeholder ? "待采集店铺占位" : "店铺线索"}：${store.name}，沙盘方位待核实`}
                aria-pressed={active}
                className={`${styles.marker} ${styles.storeMarker} ${store.placeholder ? styles.placeholderMarker : ""} ${active ? styles.markerActive : ""}`}
                key={store.id}
                onClick={() => chooseStore(store)}
                style={markerStyle(store.x, store.y)}
                type="button"
              >
                <span>{store.placeholder ? "待" : "线"}</span>
                <b>{store.placeholder ? "店铺待采集" : store.name}</b>
              </button>
            );
          })}

          <p className={styles.mapNote} id="sandbox-map-note">青绿场景沙盘 · 店铺针为关联线索席，不代表真实距离、方位或路线</p>
        </div>

        <div aria-live="polite" className={styles.summary}>
          {selectedSpot && (
            <>
              <div className={styles.summaryHeading}>
                <span className={styles.summaryIcon}>景</span>
                <div>
                  <small>当前打卡点 · 资料待完善</small>
                  <h3>{selectedSpot.name}</h3>
                  <p>{selectedSpot.note}。点击沙盘上的“线”标记，可查看与真实帖子关联的店铺线索。</p>
                </div>
              </div>
              <div className={styles.factGrid}>
                <article><span>相关案例</span><strong>{cityCases.filter((item) => item.spot === selectedSpot.name).length || "待采集"}</strong></article>
                <article><span>推荐时段</span><strong>待采集</strong></article>
                <article><span>真实路线</span><strong>待地图核实</strong></article>
              </div>
            </>
          )}

          {selectedStore && selectedPrice && (
            <>
              <div className={styles.summaryHeading}>
                <span className={styles.summaryIcon}>妆</span>
                <div>
                  <small>{selectedStore.placeholder ? "店铺分布占位 · 待采集" : "帖子提及的妆造方"}</small>
                  <h3>{selectedStore.name}</h3>
                  <p>{selectedStore.placeholder ? "这里预留给后续采集到的真实妆造店，不代表附近确有该店。" : selectedStore.address || "实体地址待采集；当前沙盘位置不是店铺真实坐标。"}</p>
                </div>
                <span className={selectedStore.bookingEnabled ? styles.connected : styles.pending}>
                  {selectedStore.bookingEnabled ? "平台预约已接入" : "预约待接入"}
                </span>
              </div>

              <div className={styles.factGrid}>
                <article><span>价格</span><strong>{selectedPrice.value}</strong><small>{selectedPrice.note}</small></article>
                <article><span>实体位置</span><strong>{selectedStore.address || "地址待采集"}</strong><small>不展示虚构距离</small></article>
                <article><span>用户成片</span><strong>{selectedStore.previews.length ? `${selectedStore.previews.length} 篇可看` : "待采集"}</strong><small>{selectedStore.caseIds.length ? `${selectedStore.caseIds.length} 篇真实关联案例` : "暂无关联帖子"}</small></article>
              </div>

              <div className={styles.actions}>
                <button aria-expanded={galleryOpen} onClick={() => setGalleryOpen((open) => !open)} type="button">
                  {galleryOpen ? "收起用户成片" : "查看相关用户成片"}
                </button>
                {selectedStore.bookingEnabled && selectedStore.caseIds[0] && onRequestBooking ? (
                  <button className={styles.primaryAction} onClick={() => requestBooking(selectedStore)} type="button">进入平台预约</button>
                ) : selectedStore.bookingEnabled && selectedStore.caseIds[0] ? (
                  <a className={styles.primaryAction} href={`#booking=${encodeURIComponent(selectedStore.caseIds[0])}`}>进入平台预约</a>
                ) : selectedStore.profileUrl ? (
                  <a className={styles.primaryAction} href={selectedStore.profileUrl} rel="noreferrer" target="_blank">查看采集到的店铺主页</a>
                ) : selectedStore.sourceUrl ? (
                  <a className={styles.primaryAction} href={selectedStore.sourceUrl} rel="noreferrer" target="_blank">回原帖核实店铺</a>
                ) : (
                  <button className={styles.primaryAction} disabled type="button">店铺资料待采集</button>
                )}
              </div>

              {galleryOpen && (
                <div aria-label={`${selectedStore.name}相关用户成片`} className={styles.gallery}>
                  {selectedStore.previews.length ? selectedStore.previews.map((preview) => (
                    <button
                      aria-label={`打开相关案例：${preview.title}`}
                      key={preview.caseId}
                      onClick={() => openCase(preview.caseId)}
                      type="button"
                    >
                      {preview.image ? <img alt={`${selectedStore.name}相关用户成片：${preview.title}`} referrerPolicy="no-referrer" src={preview.image} /> : <span aria-hidden="true">成片待补</span>}
                      <span>{preview.title}<small>{preview.spot || "景点待核实"}</small></span>
                    </button>
                  )) : [0, 1, 2].map((index) => (
                    <div className={styles.galleryPlaceholder} key={index}>
                      <span>成片</span>
                      <small>待采集</small>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <section aria-labelledby="collected-store-title" className={styles.storeSection}>
        <header className={styles.storeSectionHead}>
          <div>
            <span>COLLECTED PROVIDERS</span>
            <h2 id="collected-store-title">帖子里真正提到过的店</h2>
            <p>这里只展示采集案例明确提到的名称；未核实地址、距离和预约状态不会由系统猜测。</p>
          </div>
          <b>{realStores.length ? `${realStores.length} 家线索店铺` : "等待真实采集"}</b>
        </header>

        {realStores.length ? (
          <div className={styles.storeRail}>
            {realStores.map((store) => {
              const active = selectedStore?.id === store.id;
              const price = priceCopy(store);
              return (
                <button
                  aria-pressed={active}
                  className={active ? styles.storeTileActive : styles.storeTile}
                  key={store.id}
                  onClick={() => {
                    chooseStore(store);
                    setGalleryOpen(true);
                  }}
                  type="button"
                >
                  <span className={styles.storeMark}>妆</span>
                  <span className={styles.storeCopy}>
                    <small>{store.spots.join(" · ") || `${city} · 景点待核实`}</small>
                    <strong>{store.name}</strong>
                    <em>{price.value}</em>
                  </span>
                  <span className={styles.storeMeta}>
                    <b>{store.previews.length} 篇成片</b>
                    <small>{store.bookingEnabled ? "已接入平台预约" : "尚未接入预约"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyStores}>
            <span>{city.slice(0, 1)}</span>
            <div><strong>{city}店铺资料还在等待真实采集</strong><p>城市和景点入口保留，但不会先放虚构帖子、价格或店铺位置。</p></div>
          </div>
        )}

        {selectedStore && !selectedStore.placeholder && selectedPrice && (
          <article className={styles.selectedStorePanel}>
            <div className={styles.selectedStoreTop}>
              <div>
                <small>原帖明确提到的妆造方</small>
                <h3>{selectedStore.name}</h3>
                <p>{selectedStore.address || "实体地址待核实；目前只能确认它与下面的真实帖子有关联。"}</p>
              </div>
              <span>{selectedStore.bookingEnabled ? "平台预约已接入" : "预约尚未接入"}</span>
            </div>
            <div className={styles.selectedFacts}>
              <div><small>价格准备</small><strong>{selectedPrice.value}</strong><span>{selectedPrice.note}</span></div>
              <div><small>用户成片</small><strong>{selectedStore.previews.length} 篇</strong><span>按原帖关联，不重复计算图片</span></div>
              <div><small>地图信息</small><strong>{selectedStore.address || "待核实"}</strong><span>不展示虚构距离</span></div>
            </div>
            <div aria-label={`${selectedStore.name}相关用户成片`} className={styles.storePreviewRail}>
              {selectedStore.previews.length ? selectedStore.previews.map((preview) => (
                <button key={preview.caseId} onClick={() => openCase(preview.caseId)} type="button">
                  {preview.image ? <img alt={`${selectedStore.name}相关成片：${preview.title}`} referrerPolicy="no-referrer" src={preview.image} /> : <span>成片待补</span>}
                  <span><strong>{preview.title}</strong><small>{preview.spot || "景点待核实"}</small></span>
                </button>
              )) : <div className={styles.previewEmpty}>已预留用户成片位置，等待后续真实帖子填入。</div>}
            </div>
            <div className={styles.storePanelActions}>
              {selectedStore.profileUrl ? <a href={selectedStore.profileUrl} rel="noreferrer" target="_blank">查看采集到的店铺主页 ↗</a> : selectedStore.sourceUrl ? <a href={selectedStore.sourceUrl} rel="noreferrer" target="_blank">回原帖核实店铺 ↗</a> : <span>店铺主页仍待核实</span>}
              {selectedStore.bookingEnabled && selectedStore.caseIds[0] ? (
                onRequestBooking ? <button onClick={() => requestBooking(selectedStore)} type="button">进入平台预约</button> : <a className={styles.connectedBooking} href={`#booking=${encodeURIComponent(selectedStore.caseIds[0])}`}>进入平台预约</a>
              ) : <button onClick={() => document.getElementById("booking-demo-title")?.scrollIntoView({ behavior: "smooth", block: "start" })} type="button">先体验标准预约流程</button>}
            </div>
          </article>
        )}
      </section>

      <ExploreBookingDemo />
    </section>
  );
}

export default ExploreSandbox;
