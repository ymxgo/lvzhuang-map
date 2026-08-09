"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./explore-booking-demo.module.css";

type DemoMode = "all" | "makeup" | "photo";
type ContactType = "微信" | "手机号";

type DemoPackage = {
  id: string;
  name: string;
  note: string;
  includes: string[];
};

type DemoStore = {
  id: string;
  mark: string;
  name: string;
  mode: DemoMode;
  modeLabel: string;
  headline: string;
  packages: DemoPackage[];
  extras: string[];
};

export type SavedDemoRequest = {
  id: string;
  demo: true;
  storeId: string;
  storeName: string;
  packageId: string;
  packageName: string;
  date: string;
  period: string;
  extras: string[];
  contactName: string;
  contactType: ContactType;
  contactValue: string;
  createdAt: string;
};

export type ExploreBookingDemoProps = {
  storageKey?: string;
  onSaved?: (request: SavedDemoRequest) => void;
};

const stores: DemoStore[] = [
  {
    id: "demo-all",
    mark: "全",
    name: "长安灯影造型所（演示）",
    mode: "all",
    modeLabel: "全包流程演示",
    headline: "妆造、服装与摄影放在一张需求单里",
    packages: [
      { id: "all-basic", name: "全包体验流程示例", note: "价格待真实商家提供", includes: ["妆发意向", "服装意向", "摄影需求"] },
      { id: "all-night", name: "夜景全包流程示例", note: "价格与服务范围待接入", includes: ["妆发意向", "夜景拍摄", "精修需求"] },
    ],
    extras: ["首饰与发饰需求", "夜景补光需求", "双人同行需求"],
  },
  {
    id: "demo-makeup",
    mark: "妆",
    name: "云鬓妆造间（演示）",
    mode: "makeup",
    modeLabel: "妆造流程演示",
    headline: "先把妆发、服装和到店时间说明白",
    packages: [
      { id: "makeup-look", name: "妆发与服装流程示例", note: "价格待真实商家提供", includes: ["妆面方向", "发型方向", "服装尺码"] },
      { id: "makeup-only", name: "仅妆发流程示例", note: "是否可单独预约待接入", includes: ["妆面方向", "发型方向"] },
    ],
    extras: ["假发与发包需求", "敏感肌提前沟通", "陪同换装需求"],
  },
  {
    id: "demo-photo",
    mark: "摄",
    name: "拾光摄影组（演示）",
    mode: "photo",
    modeLabel: "摄影流程演示",
    headline: "摄影与妆造分开找时，单独提交拍摄意向",
    packages: [
      { id: "photo-solo", name: "单人跟拍流程示例", note: "时长与价格待真实商家提供", includes: ["拍摄时段", "风格意向", "交付需求"] },
      { id: "photo-pair", name: "双人同行流程示例", note: "人数规则待真实商家提供", includes: ["双人拍摄", "风格意向", "交付需求"] },
    ],
    extras: ["夜景补光需求", "原片交付需求", "增加精修需求"],
  },
];

const periods = ["上午意向 · 09:00—12:00", "下午意向 · 13:00—17:00", "傍晚意向 · 17:00—19:00", "夜景意向 · 19:00以后"];
const stepLabels = ["套餐", "日期", "服务", "联系", "确认"];

function localDate(daysFromToday: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function saveLocalRequest(key: string, request: SavedDemoRequest) {
  try {
    const current = JSON.parse(localStorage.getItem(key) || "[]") as SavedDemoRequest[];
    localStorage.setItem(key, JSON.stringify([request, ...current].slice(0, 20)));
  } catch {
    localStorage.setItem(key, JSON.stringify([request]));
  }
}

export function ExploreBookingDemo({
  storageKey = "lvzhuang-explore-booking-demo",
  onSaved,
}: ExploreBookingDemoProps) {
  const [activeStore, setActiveStore] = useState<DemoStore | null>(null);
  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState("");
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState("");
  const [extras, setExtras] = useState<string[]>([]);
  const [extrasDecided, setExtrasDecided] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactType, setContactType] = useState<ContactType>("微信");
  const [contactValue, setContactValue] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saved, setSaved] = useState<SavedDemoRequest | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLElement | null>(null);
  const minDate = useMemo(() => localDate(1), []);
  const maxDate = useMemo(() => localDate(90), []);
  const chosenPackage = activeStore?.packages.find((item) => item.id === packageId);
  const validDate = Boolean(date && date >= minDate && date <= maxDate);
  const canContinue = [
    Boolean(packageId),
    validDate && Boolean(period),
    extrasDecided,
    Boolean(contactName.trim() && contactValue.trim() && acknowledged),
    true,
  ][step];

  function reset() {
    setStep(0);
    setPackageId("");
    setDate("");
    setPeriod("");
    setExtras([]);
    setExtrasDecided(false);
    setContactName("");
    setContactType("微信");
    setContactValue("");
    setAcknowledged(false);
    setSaved(null);
  }

  function open(store: DemoStore, trigger: HTMLButtonElement) {
    openerRef.current = trigger;
    reset();
    setActiveStore(store);
  }

  function close() {
    setActiveStore(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  useEffect(() => {
    if (!activeStore) return;
    const previousOverflow = document.body.style.overflow;
    // eslint-disable-next-line react-hooks/immutability -- an open modal must lock scrolling behind the dialog
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeRef.current?.focus());

    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keydown);
    };
  }, [activeStore]);

  function toggleExtra(value: string) {
    setExtrasDecided(true);
    setExtras((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function chooseNoExtras() {
    setExtras([]);
    setExtrasDecided(true);
  }

  function submit() {
    if (!activeStore || !chosenPackage || !validDate || !period || !extrasDecided || !contactName.trim() || !contactValue.trim() || !acknowledged) return;
    const request: SavedDemoRequest = {
      id: makeId(),
      demo: true,
      storeId: activeStore.id,
      storeName: activeStore.name,
      packageId: chosenPackage.id,
      packageName: chosenPackage.name,
      date,
      period,
      extras,
      contactName: contactName.trim(),
      contactType,
      contactValue: contactValue.trim(),
      createdAt: new Date().toISOString(),
    };
    saveLocalRequest(storageKey, request);
    setSaved(request);
    onSaved?.(request);
  }

  return (
    <section aria-labelledby="booking-demo-title" className={styles.section}>
      <header className={styles.intro}>
        <div>
          <span className={styles.kicker}>BOOKING FLOW LAB</span>
          <h2 id="booking-demo-title">三种预约方式，先把流程走明白</h2>
          <p>以下均为界面与交互演示，不对应真实商家，不提供真实评分、地址、价格或可用档期。</p>
        </div>
        <span className={styles.demoBadge}>预约流程演示 · 非真实商家</span>
      </header>

      <div className={styles.storeGrid}>
        {stores.map((store) => (
          <article className={`${styles.storeCard} ${styles[store.mode]}`} key={store.id}>
            <div className={styles.cardVisual} aria-hidden="true">
              <span>{store.mark}</span>
              <i />
              <i />
              <i />
            </div>
            <div className={styles.cardBody}>
              <span className={styles.mode}>{store.modeLabel}</span>
              <h3>{store.name}</h3>
              <p>{store.headline}</p>
              <div className={styles.honestyRow}>
                <span>无真实评分</span>
                <span>地址待接入</span>
                <span>档期待接入</span>
              </div>
              <button onClick={(event) => open(store, event.currentTarget)} type="button">
                进入预约演示
                <span aria-hidden="true">›</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeStore && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          role="presentation"
        >
          <section
            aria-describedby="booking-demo-description"
            aria-labelledby="booking-demo-dialog-title"
            aria-modal="true"
            className={styles.sheet}
            ref={sheetRef}
            role="dialog"
          >
            <div aria-hidden="true" className={styles.handle} />
            <button aria-label="关闭预约流程演示" className={styles.close} onClick={close} ref={closeRef} type="button">×</button>

            {!saved ? (
              <>
                <header className={styles.sheetHeader}>
                  <span>预约流程演示 · 非真实商家</span>
                  <h2 id="booking-demo-dialog-title">{activeStore.name}</h2>
                  <p id="booking-demo-description">不会读取真实档期，不会向任何店铺发送信息。</p>
                </header>

                <ol aria-label="预约演示步骤" className={styles.steps}>
                  {stepLabels.map((label, index) => (
                    <li aria-current={step === index ? "step" : undefined} className={step === index ? styles.currentStep : index < step ? styles.finishedStep : ""} key={label}>
                      <span>{index < step ? "✓" : index + 1}</span>
                      <small>{label}</small>
                    </li>
                  ))}
                </ol>

                <div aria-live="polite" className={styles.stepTitle}>
                  <span>步骤 {step + 1} / {stepLabels.length}</span>
                  <strong>{step === 0 ? "选择一个演示套餐" : step === 1 ? "填写意向日期与时段" : step === 2 ? "决定是否增加服务需求" : step === 3 ? "留下本机演示联系方式" : "确认这张演示需求单"}</strong>
                </div>

                <div className={styles.content}>
                  {step === 0 && (
                    <div className={styles.packageList}>
                      {activeStore.packages.map((item) => (
                        <button aria-pressed={packageId === item.id} className={packageId === item.id ? styles.selectedChoice : ""} key={item.id} onClick={() => setPackageId(item.id)} type="button">
                          <span>{packageId === item.id ? "✓" : "＋"}</span>
                          <div>
                            <strong>{item.name}</strong>
                            <small>{item.note}</small>
                            <p>{item.includes.join(" · ")}</p>
                          </div>
                        </button>
                      ))}
                      <p className={styles.inlineNotice}>套餐名称和内容均为流程占位，不代表任何真实店铺报价或服务承诺。</p>
                    </div>
                  )}

                  {step === 1 && (
                    <div className={styles.dateStep}>
                      <label>
                        <span>意向日期 *</span>
                        <input max={maxDate} min={minDate} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
                        <small>只能选择从明天起未来 90 天；这不是可用档期查询。</small>
                      </label>
                      <fieldset>
                        <legend>意向时段 *</legend>
                        <div className={styles.periodGrid}>
                          {periods.map((item) => (
                            <button aria-pressed={period === item} className={period === item ? styles.selectedChoice : ""} key={item} onClick={() => setPeriod(item)} type="button">{item}</button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {step === 2 && (
                    <div className={styles.extraStep}>
                      <p>这里记录你希望向商家询问的项目，不表示商家一定提供。</p>
                      <div className={styles.extraGrid}>
                        {activeStore.extras.map((item) => (
                          <button aria-pressed={extras.includes(item)} className={extras.includes(item) ? styles.selectedChoice : ""} key={item} onClick={() => toggleExtra(item)} type="button">
                            <span>{extras.includes(item) ? "✓" : "＋"}</span>{item}
                          </button>
                        ))}
                        <button aria-pressed={extrasDecided && extras.length === 0} className={extrasDecided && extras.length === 0 ? styles.selectedChoice : ""} onClick={chooseNoExtras} type="button">
                          <span>{extrasDecided && extras.length === 0 ? "✓" : "○"}</span>暂不增加服务需求
                        </button>
                      </div>
                      <small>请选择至少一项，或明确选择“暂不增加”，才能继续。</small>
                    </div>
                  )}

                  {step === 3 && (
                    <div className={styles.contactStep}>
                      <label>
                        <span>怎么称呼你 *</span>
                        <input autoComplete="name" onChange={(event) => setContactName(event.target.value)} placeholder="仅保存在本机演示记录" value={contactName} />
                      </label>
                      <fieldset>
                        <legend>联系方式类型</legend>
                        <div className={styles.contactTypes}>
                          {(["微信", "手机号"] as ContactType[]).map((item) => (
                            <button aria-pressed={contactType === item} className={contactType === item ? styles.selectedChoice : ""} key={item} onClick={() => setContactType(item)} type="button">{item}</button>
                          ))}
                        </div>
                      </fieldset>
                      <label>
                        <span>{contactType} *</span>
                        <input autoComplete={contactType === "手机号" ? "tel" : "off"} inputMode={contactType === "手机号" ? "tel" : "text"} onChange={(event) => setContactValue(event.target.value)} placeholder={contactType === "手机号" ? "输入演示手机号" : "输入演示微信号"} value={contactValue} />
                      </label>
                      <label className={styles.consent}>
                        <input checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} type="checkbox" />
                        <span>我知道这只是本机预约流程演示，填写内容不会发送给商家。</span>
                      </label>
                    </div>
                  )}

                  {step === 4 && chosenPackage && (
                    <div className={styles.confirmStep}>
                      <div className={styles.demoAlert}>
                        <span>演</span>
                        <div><strong>这是一张演示需求单</strong><small>没有真实店铺、价格、地址或档期承诺</small></div>
                      </div>
                      <dl>
                        <div><dt>演示店铺</dt><dd>{activeStore.name}</dd></div>
                        <div><dt>流程类型</dt><dd>{activeStore.modeLabel}</dd></div>
                        <div><dt>演示套餐</dt><dd>{chosenPackage.name}</dd></div>
                        <div><dt>意向日期</dt><dd>{date}</dd></div>
                        <div><dt>意向时段</dt><dd>{period}</dd></div>
                        <div><dt>附加需求</dt><dd>{extras.length ? extras.join("、") : "暂不增加"}</dd></div>
                        <div><dt>联系人</dt><dd>{contactName} · {contactType}</dd></div>
                      </dl>
                      <p>点击保存后，数据仅写入当前浏览器 localStorage；不会联网，也不会通知任何商家。</p>
                    </div>
                  )}
                </div>

                <footer className={styles.footer}>
                  {step > 0 && <button className={styles.secondary} onClick={() => setStep((current) => Math.max(0, current - 1))} type="button">上一步</button>}
                  {step < stepLabels.length - 1 ? (
                    <button className={styles.primary} disabled={!canContinue} onClick={() => canContinue && setStep((current) => current + 1)} type="button">下一步</button>
                  ) : (
                    <button className={styles.primary} onClick={submit} type="button">保存演示预约</button>
                  )}
                </footer>
              </>
            ) : (
              <div aria-live="polite" className={styles.success}>
                <span aria-hidden="true">✓</span>
                <small>已保存到本机</small>
                <h2 id="booking-demo-dialog-title">演示预约已完成</h2>
                <p>这条记录只存在于当前浏览器，不会发送给“{saved.storeName}”或任何真实商家。</p>
                <div>
                  <strong>{saved.packageName}</strong>
                  <span>{saved.date} · {saved.period}</span>
                  <small>预约流程演示 · 非真实商家</small>
                </div>
                <button className={styles.primary} onClick={close} type="button">完成并关闭</button>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default ExploreBookingDemo;
