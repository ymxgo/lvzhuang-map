"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import styles from "./city-diorama.module.css";

export type DioramaCity = "西安" | "洛阳" | "延吉" | "杭州";

export type DioramaSpot = {
  id: string;
  name: string;
  shortName: string;
  note: string;
  x: number;
  y: number;
};

export type DioramaCityConfig = {
  city: DioramaCity;
  subtitle: string;
  theme: "xian" | "luoyang" | "yanji" | "hangzhou";
  accent: string;
  jade: string;
  water: string;
  ridge: string;
  spots: DioramaSpot[];
};

export type CityDioramaProps = {
  selectedCity: DioramaCity;
  onCityChange: (city: DioramaCity) => void;
  onSpotChange: (spot: string) => void;
  selectedSpot?: string;
  className?: string;
};

export const CITY_DIORAMA_CONFIG: Record<DioramaCity, DioramaCityConfig> = {
  西安: {
    city: "西安",
    subtitle: "城墙与盛唐灯火",
    theme: "xian",
    accent: "#c96b40",
    jade: "#315f4f",
    water: "#6b9a8b",
    ridge: "#36584d",
    spots: [
      { id: "datang-night", name: "大唐不夜城", shortName: "不夜城", note: "盛唐夜景与街区人像", x: 54, y: 43 },
      { id: "furong-garden", name: "大唐芙蓉园", shortName: "芙蓉园", note: "宫苑、水岸与朱墙", x: 73, y: 59 },
      { id: "bell-tower", name: "钟楼", shortName: "钟楼", note: "城市灯影与中轴街景", x: 32, y: 49 },
      { id: "city-wall", name: "西安城墙", shortName: "城墙", note: "长线城垣与落日", x: 22, y: 72 },
      { id: "huaqing-palace", name: "华清宫", shortName: "华清宫", note: "山麓宫苑与唐风故事", x: 81, y: 31 },
    ],
  },
  洛阳: {
    city: "洛阳",
    subtitle: "神都宫阙与伊水",
    theme: "luoyang",
    accent: "#a95854",
    jade: "#3f6658",
    water: "#729d91",
    ridge: "#4a6459",
    spots: [
      { id: "luoyi-old-town", name: "洛邑古城", shortName: "洛邑古城", note: "古城街巷与夜游灯景", x: 54, y: 51 },
      { id: "longmen", name: "龙门石窟", shortName: "龙门", note: "伊水山崖与石刻长卷", x: 79, y: 67 },
      { id: "yingtian-gate", name: "隋唐洛阳城·应天门", shortName: "应天门", note: "神都中轴与宫阙夜色", x: 31, y: 48 },
      { id: "white-horse", name: "白马寺", shortName: "白马寺", note: "寺院松影与静谧古意", x: 72, y: 29 },
    ],
  },
  延吉: {
    city: "延吉",
    subtitle: "山城屋脊与民族街巷",
    theme: "yanji",
    accent: "#bd6551",
    jade: "#39645c",
    water: "#6c9aa0",
    ridge: "#3d5f58",
    spots: [
      { id: "folk-custom-park", name: "中国朝鲜族民俗园", shortName: "民俗园", note: "民族建筑与服饰写真", x: 63, y: 51 },
      { id: "internet-wall", name: "延吉网红墙", shortName: "网红墙", note: "城市霓虹与街头人像", x: 29, y: 59 },
      { id: "maoer-mountain", name: "帽儿山", shortName: "帽儿山", note: "山城远眺与晨雾", x: 79, y: 28 },
      { id: "morning-market", name: "水上市场", shortName: "水上市场", note: "清晨烟火与市集色彩", x: 43, y: 75 },
    ],
  },
  杭州: {
    city: "杭州",
    subtitle: "湖山烟雨与宋韵",
    theme: "hangzhou",
    accent: "#a35f50",
    jade: "#2f6559",
    water: "#719f9a",
    ridge: "#3c655b",
    spots: [
      { id: "west-lake", name: "西湖", shortName: "西湖", note: "湖岸、长堤与柔光", x: 50, y: 59 },
      { id: "lingyin", name: "灵隐寺", shortName: "灵隐寺", note: "山林寺院与青苔石径", x: 25, y: 37 },
      { id: "hefang-street", name: "河坊街", shortName: "河坊街", note: "宋韵街巷与市井灯火", x: 73, y: 67 },
      { id: "xixi", name: "西溪湿地", shortName: "西溪", note: "水巷芦苇与舟行慢景", x: 79, y: 33 },
    ],
  },
};

const CITIES = Object.keys(CITY_DIORAMA_CONFIG) as DioramaCity[];
const STAR_POSITIONS = [
  [7, 22], [13, 48], [18, 15], [25, 36], [31, 11], [38, 27], [45, 17], [52, 39],
  [58, 12], [64, 31], [70, 19], [76, 42], [82, 13], [88, 32], [94, 21], [34, 46],
] as const;

function localHour() {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function formatHour(value: number) {
  const totalMinutes = Math.round(value * 60 / 15) * 15;
  const hour = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function periodLabel(hour: number) {
  if (hour < 5.5) return "深夜星河";
  if (hour < 8) return "晨雾初醒";
  if (hour < 16.5) return "清朗日光";
  if (hour < 18.75) return "金色时刻";
  if (hour < 22.5) return "华灯入夜";
  return "静夜灯影";
}

function SceneArchitecture({ theme }: { theme: DioramaCityConfig["theme"] }) {
  return <div aria-hidden="true" className={`${styles.architecture} ${styles[`${theme}Architecture`]}`}>
    <div className={`${styles.landmark} ${styles.mainHall}`}><i/><b/><span/></div>
    <div className={`${styles.landmark} ${styles.sideHall} ${styles.sideHallOne}`}><i/><b/></div>
    <div className={`${styles.landmark} ${styles.sideHall} ${styles.sideHallTwo}`}><i/><b/></div>
    <div className={`${styles.landmark} ${styles.pagoda}`}><i/><i/><i/><b/></div>
    <div className={styles.cityWall}><i/><i/><i/><i/><i/></div>
    <div className={styles.bridge}><i/><b/><span/></div>
    <div className={styles.village}>{Array.from({ length: 7 }, (_, index) => <i key={index}/>)}</div>
    <div className={styles.trees}>{Array.from({ length: 12 }, (_, index) => <i key={index}/>)}</div>
  </div>;
}

export default function CityDiorama({
  selectedCity,
  onCityChange,
  onSpotChange,
  selectedSpot,
  className = "",
}: CityDioramaProps) {
  const config = CITY_DIORAMA_CONFIG[selectedCity];
  const [hour, setHour] = useState(12);
  const [live, setLive] = useState(true);
  const [internalSelection, setInternalSelection] = useState(() => ({
    city: selectedCity,
    spot: config.spots[0]?.name ?? "",
  }));

  useEffect(() => {
    if (!live) return;
    const sync = () => setHour(localHour());
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => window.clearInterval(timer);
  }, [live]);

  const activeSpotName = selectedSpot && config.spots.some((spot) => spot.name === selectedSpot)
    ? selectedSpot
    : internalSelection.city === selectedCity
      ? internalSelection.spot
      : config.spots[0]?.name ?? "";
  const activeSpot = config.spots.find((spot) => spot.name === activeSpotName) ?? config.spots[0];
  const night = hour < 5.75 || hour >= 18.75;
  const twilight = (hour >= 5.25 && hour < 7.25) || (hour >= 17 && hour < 19.75);

  const celestial = useMemo(() => {
    if (!night) {
      const progress = Math.max(0, Math.min(1, (hour - 5.75) / 13));
      return { x: 7 + progress * 86, y: 68 - Math.sin(progress * Math.PI) * 54 };
    }
    const adjusted = hour >= 18.75 ? hour : hour + 24;
    const progress = Math.max(0, Math.min(1, (adjusted - 18.75) / 11));
    return { x: 8 + progress * 84, y: 62 - Math.sin(progress * Math.PI) * 43 };
  }, [hour, night]);

  const sceneStyle = {
    "--accent": config.accent,
    "--jade": config.jade,
    "--water": config.water,
    "--ridge": config.ridge,
    "--celestial-x": `${celestial.x}%`,
    "--celestial-y": `${celestial.y}%`,
  } as CSSProperties;

  function chooseCity(city: DioramaCity) {
    const next = CITY_DIORAMA_CONFIG[city];
    setInternalSelection({ city, spot: next.spots[0]?.name ?? "" });
    onCityChange(city);
    if (next.spots[0]) onSpotChange(next.spots[0].name);
  }

  function chooseSpot(spot: DioramaSpot) {
    setInternalSelection({ city: selectedCity, spot: spot.name });
    onSpotChange(spot.name);
  }

  function restoreLive() {
    setHour(localHour());
    setLive(true);
  }

  return <section className={`${styles.shell} ${className}`} aria-label="城市旅妆艺术沙盘">
    <div className={styles.heading}>
      <div>
        <span className={styles.kicker}>CITY DIORAMA</span>
        <h2>在一座城里，先看见想去的那一幕</h2>
        <p>切换城市与时刻，点选景点查看对应的真实妆造灵感。</p>
      </div>
      <span className={styles.disclaimer}>艺术沙盘 · 非导航地图</span>
    </div>

    <div className={styles.cityTabs} aria-label="切换城市" role="tablist">
      {CITIES.map((city) => {
        const item = CITY_DIORAMA_CONFIG[city];
        return <button
          aria-selected={selectedCity === city}
          className={selectedCity === city ? styles.activeCity : ""}
          key={city}
          onClick={() => chooseCity(city)}
          role="tab"
          type="button"
        >
          <strong>{city}</strong>
          <small>{item.subtitle}</small>
        </button>;
      })}
    </div>

    <div
      className={`${styles.viewport} ${styles[config.theme]} ${night ? styles.night : styles.day} ${twilight ? styles.twilight : ""}`}
      style={sceneStyle}
    >
      <div aria-hidden="true" className={styles.sky}>
        <div className={styles.stars}>{STAR_POSITIONS.map(([left, top], index) => <i key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * .17}s` }}/>)}</div>
        <div className={styles.sun}/>
        <div className={styles.moon}><i/></div>
        <div className={`${styles.cloud} ${styles.cloudOne}`}><i/><i/></div>
        <div className={`${styles.cloud} ${styles.cloudTwo}`}><i/><i/></div>
        <div className={styles.haze}/>
      </div>

      <div className={styles.sceneMeta}>
        <span>{config.city}</span>
        <strong>{config.subtitle}</strong>
        <small>{periodLabel(hour)} · {formatHour(hour)}</small>
      </div>

      <div className={styles.world}>
        <div className={styles.terrain}>
          <div aria-hidden="true" className={styles.mountainRange}><i/><i/><i/><i/><i/></div>
          <div aria-hidden="true" className={styles.landMass}/>
          <div aria-hidden="true" className={styles.lake}><i/><i/><i/></div>
          <div aria-hidden="true" className={styles.river}/>
          <div aria-hidden="true" className={`${styles.cloudShadow} ${styles.shadowOne}`}/>
          <div aria-hidden="true" className={`${styles.cloudShadow} ${styles.shadowTwo}`}/>
          <SceneArchitecture theme={config.theme}/>
          <div className={styles.spots}>
            {config.spots.map((spot, index) => {
              const active = activeSpot?.id === spot.id;
              return <button
                aria-label={`查看${spot.name}`}
                aria-pressed={active}
                className={active ? styles.activeSpot : ""}
                key={spot.id}
                onClick={() => chooseSpot(spot)}
                style={{ left: `${spot.x}%`, top: `${spot.y}%`, "--marker-delay": `${index * .12}s` } as CSSProperties}
                type="button"
              >
                <i><b/></i>
                <span>{spot.shortName}</span>
              </button>;
            })}
          </div>
        </div>
      </div>

      <div className={styles.spotCard} aria-live="polite">
        <span>当前取景地</span>
        <strong>{activeSpot?.name}</strong>
        <p>{activeSpot?.note}</p>
        <b>点击标记切换</b>
      </div>

      <div className={styles.timeDock}>
        <div className={styles.timeCopy}>
          <span className={live ? styles.liveDot : ""}/>
          <div><small>{live ? "跟随本地时刻" : "预览光线"}</small><strong>{formatHour(hour)}</strong></div>
        </div>
        <label className={styles.timeSlider}>
          <span className={styles.visuallyHidden}>拖动预览一天中的光线</span>
          <input
            aria-label="预览沙盘时刻"
            max="23.75"
            min="0"
            onChange={(event) => { setLive(false); setHour(Number(event.target.value)); }}
            step="0.25"
            type="range"
            value={hour}
          />
          <i><span>06</span><span>12</span><span>18</span><span>24</span></i>
        </label>
        <button disabled={live} onClick={restoreLive} type="button">恢复实时</button>
      </div>
    </div>
  </section>;
}
