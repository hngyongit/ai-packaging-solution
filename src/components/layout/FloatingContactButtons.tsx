import { PhoneCall } from 'lucide-react'

import styles from './FloatingContactButtons.module.css'

const ZALO_NUMBER = '0968373066'
const HOTLINE_NUMBER = '0968373066'
const MESSENGER_URL = 'https://m.me/61584385318993'

export function FloatingContactButtons() {
  return (
    <aside aria-label="Liên hệ nhanh" className={styles.root}>
      <a
        className={`${styles.button} ${styles.zalo}`}
        href={`https://zalo.me/${ZALO_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nhắn Zalo"
        title="Nhắn Zalo"
      >
        <span className={styles.core}>
          <img
            className={styles.zaloLogo}
            src="/icons/zalo.svg"
            alt=""
            aria-hidden="true"
          />
        </span>
        <span className={styles.tooltip} aria-hidden="true">Nhắn Zalo</span>
      </a>

      <a
        className={`${styles.button} ${styles.messenger}`}
        href={MESSENGER_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Nhắn tin fanpage Facebook"
        title="Nhắn tin fanpage Facebook"
      >
        <span className={styles.core}>
          <img className={styles.messengerIcon} src="/icons/messenger.svg" alt="" aria-hidden="true" />
        </span>
        <span className={styles.tooltip} aria-hidden="true">Nhắn fanpage</span>
      </a>

      <a
        className={`${styles.button} ${styles.phone}`}
        href={`tel:${HOTLINE_NUMBER}`}
        aria-label={`Gọi ${HOTLINE_NUMBER}`}
        title={`Gọi ${HOTLINE_NUMBER}`}
      >
        <span className={styles.core}>
          <PhoneCall className={styles.phoneIcon} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className={styles.tooltip} aria-hidden="true">Gọi 096 837 3066</span>
      </a>
    </aside>
  )
}
