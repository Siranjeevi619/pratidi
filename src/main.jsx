import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles.css'

gsap.registerPlugin(ScrollTrigger)

const stories = [
  ['07', 'my anchor', '/images/7.webp'],
  ['02', 'always', '/images/2.webp'],
  ['10', 'soft proof', '/images/10.jpg'],
  ['04', 'electric', '/images/4.webp'],
  ['09', 'endless', '/images/9.jpg'],
  ['01', 'destiny', '/images/1.webp'],
  ['06', 'wild hearts', '/images/6.jpg'],
  ['03', 'forever', '/images/3.webp'],
  ['08', 'to the stars', '/images/8.jpg'],
  ['05', 'our secret', '/images/5.jpg'],
]
const newImages = [
  ['/images/10.jpg', 'soft proof'],
  ['/images/11.jpg', 'a little universe'],
  ['/images/13.webp', 'golden hour'],
  ['/images/15.webp', 'still my person'],
  ['/images/16.webp', 'always, somehow'],
]

const Arrow = () => <span className="arrow" aria-hidden="true">↗</span>
const floatingHearts = [
  ['heart-red', '7%', '17%', '0s'], ['heart-white', '87%', '12%', '.8s'],
  ['heart-red', '13%', '57%', '1.4s'], ['heart-white', '91%', '65%', '2.1s'],
  ['heart-red', '4%', '83%', '1.1s'], ['heart-white', '81%', '88%', '2.7s'],
  ['heart-red', '47%', '9%', '1.8s'], ['heart-white', '60%', '73%', '.4s'],
]
const reasons = [
  ['01', 'your laugh', 'The kind that turns an ordinary Tuesday into my favorite memory.'],
  ['02', 'your softness', 'You make the world feel less loud just by being in it.'],
  ['03', 'your magic', 'Somehow, you make even the smallest moments feel worth keeping.'],
]
const acceptedNicknames = new Set(['thimmu', 'then', 'thennu', 'honey', 'love', 'jeevi', 'jeevitha', 'silk', 'bujji', 'thango', 'chelo', 'negative', 'thim', 'thimm', 'ass', 'fav ass'])
const trackInteraction = (type, data = {}) => {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
    keepalive: true,
  }).catch((error) => console.warn('Interaction notification unavailable:', error))
}

function App() {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [burst, setBurst] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loveLevel, setLoveLevel] = useState(72)
  const [reason, setReason] = useState(0)
  const [secretFound, setSecretFound] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameSaved, setNicknameSaved] = useState(false)
  const [nicknameError, setNicknameError] = useState('')
  const [audioStarted, setAudioStarted] = useState(false)
  const [audioEngaged, setAudioEngaged] = useState(false)
  const [audioMuted, setAudioMuted] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [audioPromptDismissed, setAudioPromptDismissed] = useState(false)
  const cards = useRef(null)
  const audio = useRef(null)
  const audioStartedRef = useRef(false)
  const activeStory = stories[active]
  const progress = useRef(null)
  const cursor = useRef(null)
  const scene = useRef(null)

  const startMusic = (restart = false) => {
    if (!audio.current || audioStartedRef.current) return
    if (restart) audio.current.currentTime = 0
    audio.current.volume = 0.42
    audio.current.play()
      .then(() => {
        setAudioError(false)
        audioStartedRef.current = true
        setAudioStarted(true)
      })
      .catch((error) => {
        setAudioError(true)
        console.warn('Background music could not start:', error)
      })
  }

  const toggleMusic = () => {
    if (!audio.current) return
    if (audio.current.paused) {
      audio.current.currentTime = 0
      audio.current.muted = false
      audio.current.volume = 0.42
      audio.current.play()
        .then(() => {
          setAudioError(false)
          audioStartedRef.current = true
          setAudioStarted(true)
          setAudioMuted(false)
        })
        .catch((error) => {
          setAudioError(true)
          console.warn('Background music could not start:', error)
        })
      return
    }
    audio.current.muted = !audio.current.muted
    setAudioMuted(audio.current.muted)
  }

  const replayAudio = () => {
    trackInteraction('audio_play_requested', { source: 'audio_prompt' })
    setAudioPromptDismissed(true)
    setAudioEngaged(true)
    if (audio.current) {
        audio.current.currentTime = 0
        audio.current.muted = false
        audio.current.volume = 0.42
    }
    startMusic(true)
  }

  useEffect(() => {
    const beginOnInteraction = () => {
      setAudioEngaged(true)
      startMusic(true)
    }
    const beginWhenReady = () => startMusic(true)
    const player = audio.current
    player?.addEventListener('canplay', beginWhenReady, { once: true })
    startMusic(true)
    window.addEventListener('pointerdown', beginOnInteraction, { once: true, passive: true, capture: true })
    window.addEventListener('keydown', beginOnInteraction, { once: true, capture: true })
    return () => {
      player?.removeEventListener('canplay', beginWhenReady)
      window.removeEventListener('pointerdown', beginOnInteraction, { capture: true })
      window.removeEventListener('keydown', beginOnInteraction, { capture: true })
    }
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const loader = gsap.timeline({
        onComplete: () => setLoading(false),
      })
      loader
        .to('.loader-heart', { scale: 1.25, duration: .55, ease: 'back.out(2)' })
        .to('.loader-line', { scaleX: 1, duration: .7, ease: 'expo.inOut' }, '-=.2')
        .to('.loader-copy', { opacity: 0, y: -12, duration: .35 }, '+=.2')
        .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' })

      const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
      intro
        .from('.nav > *, .nav nav > *', { opacity: 0, y: -14, stagger: 0.06, duration: 0.65 })
        .from('.hero-kicker', { opacity: 0, x: -28, duration: 0.7 }, '-=.3')
        .from('.hero-title-line', { opacity: 0, yPercent: 115, rotate: 3, stagger: 0.12, duration: 1, ease: 'expo.out' }, '-=.35')
        .from('.hero-intro, .hero-actions', { opacity: 0, y: 26, stagger: 0.12, duration: 0.8 }, '-=.55')
        .from('.hero-stage', { opacity: 0, scale: .92, rotate: -2, duration: 1.2 }, '-=.8')

      gsap.to('.heart-float', { y: -12, duration: 2.5, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      gsap.to('.orbit', { rotate: 360, duration: 18, repeat: -1, ease: 'none' })
      gsap.to('.type-ring', { rotate: -360, duration: 24, repeat: -1, ease: 'none' })
      gsap.to('.marquee-track', { xPercent: -50, duration: 24, repeat: -1, ease: 'none' })

      gsap.to('.hero-title', {
        yPercent: -17,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      })
      gsap.to('.hero-stage', {
        yPercent: 13,
        rotate: 2,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.4 },
      })
      gsap.to('.portrait', {
        scale: 1.14,
        yPercent: -7,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.2 },
      })
      gsap.to('.hero-stage-top, .stage-caption', {
        opacity: 0,
        y: -30,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: '20% top', end: '70% top', scrub: true },
      })

      gsap.utils.toArray('.reveal').forEach((element) => gsap.fromTo(element, { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: .9, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 84%', once: true },
      }))
      gsap.fromTo('.deck-stage', { opacity: 0, y: 70, rotate: -2 }, {
        opacity: 1, y: 0, rotate: 0, ease: 'none',
        scrollTrigger: { trigger: '.deck-stage', start: 'top 88%', end: 'top 52%', scrub: 1 },
      })
      gsap.to('.spotlight-image', {
        scale: 1.18,
        xPercent: -4,
        ease: 'none',
        scrollTrigger: { trigger: '.spotlight', start: 'top bottom', end: 'bottom top', scrub: 1 },
      })
      gsap.to('.promise-inner', {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: '.promise', start: 'top bottom', end: 'bottom top', scrub: 1 },
      })
      gsap.to('.rotating-word', {
        yPercent: -70,
        ease: 'none',
        scrollTrigger: { trigger: '.reasons', start: 'top bottom', end: 'bottom top', scrub: 1.2 },
      })
      gsap.fromTo('.reason-card', { opacity: 0, y: 70, rotate: -3 }, {
        opacity: 1, y: 0, rotate: 0, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '.reasons', start: 'top 80%', end: 'top 45%', scrub: 1 },
      })
      gsap.fromTo('.memory-image', { opacity: 0, y: 90, rotate: 0 }, {
        opacity: 1, y: 0, stagger: .16, ease: 'power3.out',
        scrollTrigger: { trigger: '.memory-section', start: 'top 78%', end: 'top 35%', scrub: 1 },
      })
      gsap.fromTo('.gallery-frame', { opacity: 0, y: 70, scale: .88 }, {
        opacity: 1, y: 0, scale: 1, stagger: .12, ease: 'power3.out',
        scrollTrigger: { trigger: '.gallery-section', start: 'top 78%', end: 'top 38%', scrub: 1 },
      })
      gsap.to('.floating-decor', {
        yPercent: -28,
        rotate: 10,
        ease: 'none',
        scrollTrigger: { trigger: '.page', start: 'top top', end: 'bottom bottom', scrub: 2 },
      })
      gsap.utils.toArray('.bg-photo').forEach((photo, index) => {
        gsap.to(photo, {
          y: index % 2 ? -28 : 34,
          rotate: index % 2 ? 3 : -3,
          duration: 4 + (index % 3),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * .18,
        })
      })
      gsap.to('.bg-photo-layer', {
        yPercent: -10,
        ease: 'none',
        scrollTrigger: { trigger: '.page', start: 'top top', end: 'bottom bottom', scrub: 2.4 },
      })
      gsap.to('.scroll-love-note', {
        xPercent: 18,
        rotate: -8,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
      })
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          if (progress.current) progress.current.style.transform = `scaleX(${self.progress})`
        },
      })
    })
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const moveCursor = (event) => {
      if (!cursor.current) return
      gsap.to(cursor.current, { x: event.clientX, y: event.clientY, duration: .45, ease: 'power3.out' })
    }
    window.addEventListener('pointermove', moveCursor)
    const keyHandler = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        setLetterOpen(false)
      }
      if (event.key === 'ArrowRight') changeStory(1)
      if (event.key === 'ArrowLeft') changeStory(-1)
    }
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('pointermove', moveCursor)
      window.removeEventListener('keydown', keyHandler)
    }
  })

  useEffect(() => {
    const tiltCards = cards.current?.querySelectorAll('.story-card')
    const onMove = (event) => {
      const card = event.currentTarget
      const rect = card.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - .5
      const y = (event.clientY - rect.top) / rect.height - .5
      gsap.to(card, { rotateY: x * 7, rotateX: y * -7, transformPerspective: 900, duration: .35, ease: 'power2.out' })
    }
    const onLeave = (event) => gsap.to(event.currentTarget, { rotateY: 0, rotateX: 0, duration: .7, ease: 'elastic.out(1, .5)' })
    tiltCards?.forEach((card) => {
      card.addEventListener('pointermove', onMove)
      card.addEventListener('pointerleave', onLeave)
    })
    return () => tiltCards?.forEach((card) => {
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerleave', onLeave)
    })
  }, [])

  useEffect(() => {
    const moveScene = (event) => {
      if (!scene.current || window.matchMedia('(pointer: coarse)').matches) return
      const x = (event.clientX / window.innerWidth - .5)
      const y = (event.clientY / window.innerHeight - .5)
      gsap.to(scene.current, { rotateY: x * 2, rotateX: y * -2, duration: 1.2, ease: 'power3.out' })
      gsap.to('.hero-spark', { x: x * 16, y: y * 16, duration: 1.4, stagger: .03, ease: 'power3.out' })
    }
    window.addEventListener('pointermove', moveScene)
    return () => window.removeEventListener('pointermove', moveScene)
  }, [])

  useEffect(() => {
    gsap.fromTo('.spotlight-copy > *', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .55, stagger: .06, ease: 'power3.out' })
    gsap.fromTo('.spotlight-image', { opacity: .4, scale: 1.04 }, { opacity: 1, scale: 1, duration: .7, ease: 'power3.out' })
    gsap.fromTo('.story-card.is-active .card-image', { scale: .9, rotate: -4, opacity: .45 }, { scale: 1, rotate: 0, opacity: 1, duration: .8, ease: 'back.out(1.35)' })
    gsap.fromTo('.story-card.is-active .card-focus', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, delay: .25, ease: 'power3.out' })
  }, [active])

  const changeStory = (direction) => setActive((current) => (current + direction + stories.length) % stories.length)
  const openLetter = () => {
    trackInteraction('tap_my_love', { source: 'love_letter_button' })
    setLetterOpen(true)
    setBurst(true)
    window.setTimeout(() => setBurst(false), 1200)
  }
  const findSecret = () => {
    trackInteraction('hidden_heart_found')
    setSecretFound(true)
    setBurst(true)
    window.setTimeout(() => setBurst(false), 1200)
  }
  const saveNickname = (event) => {
    event.preventDefault()
    const value = nickname.trim()
    if (!value) return
    if (!acceptedNicknames.has(value.toLowerCase())) {
      trackInteraction('nickname_submitted', { nickname: value, accepted: false })
      setNicknameError('hmm… not that one. Try to guess again ♡')
      gsap.fromTo('.nickname-card', { x: -9 }, { x: 9, duration: .08, repeat: 7, yoyo: true, clearProps: 'x', ease: 'power1.inOut' })
      return
    }
    setNicknameError('')
    trackInteraction('nickname_submitted', { nickname: value, accepted: true })
    setNickname(value)
    setNicknameSaved(true)
    gsap.fromTo('.nickname-reveal', { opacity: 0, y: 16, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: 'back.out(1.7)' })
  }

  return (
    <div className="page">
      <audio ref={audio} src="/audio/bgm.mp3" loop preload="auto" autoPlay playsInline aria-hidden="true" onError={() => setAudioError(true)} />
      {!audioStarted && !audioPromptDismissed && <div className="audio-prompt" role="dialog" aria-live="polite" aria-label="Play background audio">
        <button className="audio-prompt-close" onClick={() => setAudioPromptDismissed(true)} aria-label="Dismiss audio prompt">×</button>
        <span className="audio-prompt-icon" aria-hidden="true">♫</span>
        <div>
          <strong>the soundtrack is waiting</strong>
          <p>Tap once to start the little music I chose for you.</p>
        </div>
        <button className="audio-prompt-action" onClick={replayAudio}>Play audio <Arrow /></button>
      </div>}
      {audioEngaged && <button className="music-toggle" onClick={toggleMusic} aria-label={audioMuted ? 'Unmute background music' : 'Mute background music'} aria-pressed={!audioMuted}>
        <span className="music-toggle-icon" aria-hidden="true">{audioMuted ? '♪̸' : '♫'}</span>
        <span>{audioMuted ? 'sound off' : audioStarted ? 'sound on' : audioError ? 'retry sound' : 'play sound'}</span>
      </button>}
      {loading && <div className="loader" aria-label="Loading love letter">
        <div className="loader-copy"><span className="loader-heart">♥</span><p>putting a little love<br />into this page<span>...</span></p><i className="loader-line" /></div>
      </div>}
      <div className="scroll-progress" aria-hidden="true"><span ref={progress} /></div>
      <div ref={cursor} className="cursor-orb" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="ambient-glow glow-one" aria-hidden="true" />
      <div className="ambient-glow glow-two" aria-hidden="true" />
      <div className="floating-decor" aria-hidden="true">
        {floatingHearts.map(([type, left, top, delay], index) => <span className={`pixel-heart ${type}`} style={{ left, top, '--delay': delay }} key={index}>♥</span>)}
        <span className="sticker sticker-love">made<br />with<br /><b>love</b> ♡</span>
        <span className="sticker sticker-xoxo">xoxo<br /><b>∞</b></span>
        <span className="sticker sticker-sparkle">✦</span>
      </div>
      <div className="bg-photo-layer" aria-hidden="true">
        {stories.map(([number, tag, image], index) => <img className={`bg-photo bg-photo-${index + 1}`} key={number} src={image} alt="" />)}
        {newImages.map(([image, tag], index) => <img className={`bg-photo bg-photo-new-${index + 1}`} key={image} src={image} alt="" />)}
      </div>

      <header className="nav shell">
        <a className="brand" href="#top" aria-label="For the one I love home">
          <span className="brand-heart">♥</span>
          <span>For the one I love<span className="dot">.</span></span>
        </a>
        <button className="hamburger" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu" aria-expanded={menuOpen}><i /><i /></button>
        <nav className={menuOpen ? 'open' : ''}>
          <a className="nav-item active" href="#stories" onClick={() => setMenuOpen(false)}>Our story</a>
          <a className="nav-item" href="#promise" onClick={() => setMenuOpen(false)}>The promise</a>
          <button className="nav-item read-button" onClick={() => { openLetter(); setMenuOpen(false) }}>Read my heart <Arrow /></button>
        </nav>
      </header>

      <main id="top">
        <section className="hero shell" ref={scene}>
          <div className="hero-copy">
            <p className="eyebrow hero-kicker"><span /> a love letter, in frames</p>
            <h1 className="hero-title"><span className="hero-title-line">My favorite</span><span className="hero-title-line"><em>love stories</em></span><span className="hero-title-line">are ours.</span></h1>
            <p className="intro hero-intro">Ten stories. Ten different ways of saying the same thing: <strong>I choose you.</strong></p>
            <div className="hero-actions">
              <a className="explore" href="#stories">Explore our universe <Arrow /></a>
              <span className="hero-meta">scroll to wander <span>↓</span></span>
            </div>
          </div>
          <div className="hero-stage">
            <div className="hero-stage-top"><span>love archive / 2024—∞</span><span>chapter 01</span></div>
            <div className="orbit" />
            <div className="portrait" />
            <span className="art-note">love<br />in every<br />frame <Arrow /></span>
            <span className="art-index">[ 01 / 10 ]</span>
            <span className="heart-float">♥</span>
            <span className="stage-caption">the kind of love<br />that feels like home</span>
            <span className="hero-spark spark-a">✦</span><span className="hero-spark spark-b">✧</span><span className="hero-spark spark-c">·</span>
            <button className="secret-heart" onClick={findSecret} aria-label="Find the hidden heart">♥</button>
            <div className="type-ring" aria-hidden="true">
              <span>YOU ARE MY FAVORITE · YOU ARE MY FAVORITE · </span>
            </div>
          </div>
        </section>

        <section className="intro-strip shell reveal">
          <span className="strip-label">for you, always</span>
          <p>Not a portfolio. Not a presentation. Just a tiny world I made because you make mine better.</p>
          <span className="strip-mark">♡ <i /> ∞</span>
        </section>
        <div className="marquee" aria-hidden="true"><div className="marquee-track"><span>you make ordinary moments feel like magic&nbsp; ✦ &nbsp;you make ordinary moments feel like magic&nbsp; ✦ &nbsp;</span><span>you make ordinary moments feel like magic&nbsp; ✦ &nbsp;you make ordinary moments feel like magic&nbsp; ✦ &nbsp;</span></div></div>

        <section className="nickname-section shell reveal" id="nickname">
          <div className="nickname-card">
            <span className="nickname-kicker">a tiny question, just for you</span>
            {!nicknameSaved ? (
              <>
                <h2>What should I<br /><em>call you?</em></h2>
                <p>Type the name that makes you smile. I’ll keep it right here, in our little corner of the internet.</p>
                <form className="nickname-form" onSubmit={saveNickname}>
                  <label htmlFor="nickname-input">your favorite nickname</label>
                  <div className={`nickname-field ${nicknameError ? 'has-error' : ''}`}>
                    <input id="nickname-input" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="e.g. my sunshine" maxLength="32" autoComplete="off" />
                    <button type="submit" aria-label="Save nickname">↗</button>
                  </div>
                  <p className={`nickname-error ${nicknameError ? 'show' : ''}`} aria-live="polite">{nicknameError || ' '}</p>
                </form>
              </>
            ) : (
              <div className="nickname-reveal">
                <span className="nickname-heart">♥</span>
                <p className="nickname-kicker">noted forever</p>
                <h2>Hi, <em>{nickname}.</em></h2>
                <p>That sounds perfect. It’s my favorite name already.</p>
              </div>
            )}
            <span className="nickname-doodle">♡</span>
          </div>
        </section>

        <section className="reasons shell reveal" id="little-things">
          <div className="reasons-heading">
            <p className="eyebrow"><span /> three things I keep falling for</p>
            <h2>The little<br /><em>things <span className="word-window"><span className="rotating-word">matter.<br />feel bigger.<br />stay forever.</span></span></em></h2>
          </div>
          <div className="reason-layout">
            <div className="reason-list">
              {reasons.map(([number, title, copy], index) => (
                <button className={`reason-card ${reason === index ? 'chosen' : ''}`} key={title} onClick={() => setReason(index)}>
                  <span>{number}</span><strong>{title}</strong><i>↗</i>
                  <p>{copy}</p>
                </button>
              ))}
            </div>
            <div className="love-meter">
              <span className="meter-label">scientifically accurate love meter</span>
              <div className="meter-heart" style={{ '--love': `${loveLevel}%` }}><span>♥</span><b>{loveLevel}%</b></div>
              <input type="range" min="1" max="100" value={loveLevel} onChange={(event) => setLoveLevel(event.target.value)} aria-label="Love meter" />
              <p>{loveLevel < 45 ? 'wait… I can explain.' : loveLevel < 90 ? 'already completely gone for you.' : 'okay, this is getting ridiculous.'}</p>
              <button className="meter-button" onClick={() => setLoveLevel(100)}>make it infinite <span>∞</span></button>
            </div>
          </div>
        </section>

        <section className="stories shell" id="stories">
          <div className="section-head reveal">
            <div><p className="eyebrow"><span /> a little something for you</p><h2>Look what<br /><em>you do to me.</em></h2></div>
            <p className="section-note">Every heart is a tiny reminder.<br />Every scroll gets a little closer<br />to what I really want to say.</p>
          </div>

          <div className="spotlight reveal">
            <div className="spotlight-image-wrap">
              <img className="spotlight-image" src={activeStory[2]} alt="" />
              <span className="spotlight-number">{activeStory[0]}</span>
              <span className="spotlight-tag">{activeStory[1]}</span>
              <div className="spotlight-dial"><span>drag / discover</span><b>↘</b></div>
            </div>
            <div className="spotlight-copy">
              <p className="spotlight-series">one of my favorite feelings</p>
              <h3>You make<br /><em>everything softer.</em></h3>
              <p className="spotlight-note">I could show you a hundred stories, but the one I keep coming back to is the one where I get to love you.</p>
              <button className="spotlight-link" onClick={() => openLetter()}>I have something to tell you <Arrow /></button>
            </div>
          </div>

          <div className="story-toolbar reveal">
            <span>{String(active + 1).padStart(2, '0')} <i /> 10</span>
            <span className="tap-hint">tap a frame to move through our story</span>
          </div>
          <div className="cards deck-stage reveal" ref={cards}>
            {stories.map(([number, tag, image], index) => {
              const distance = (index - active + stories.length) % stories.length
              const state = distance === 0 ? 'is-active' : distance === 1 ? 'is-next' : distance === stories.length - 1 ? 'is-previous' : 'is-hidden'
              return (
              <article className={`story-card ${state}`} data-index={index} key={number} onClick={() => setActive(state === 'is-previous' ? (active + stories.length - 1) % stories.length : (active + 1) % stories.length)} tabIndex={state === 'is-hidden' ? -1 : 0} aria-hidden={state === 'is-hidden'} onKeyDown={(event) => event.key === 'Enter' && setActive(state === 'is-previous' ? (active + stories.length - 1) % stories.length : (active + 1) % stories.length)}>
                <div className="card-image"><img src={image} alt="" loading={index > 2 ? 'lazy' : 'eager'} /><b>{number}</b><small>{tag}</small><span className="card-focus">view frame ↗</span></div>
              </article>
              )
            })}
          </div>
        </section>

        <section className="memory-section shell reveal" id="pratidi">
          <div className="memory-intro">
            <p className="eyebrow"><span /> the part I never say enough</p>
            <h2>My<br /><em>pratidi.</em></h2>
            <p>Not a title. Not a passing feeling. The name my heart reaches for before I even know what I need.</p>
          </div>
          <div className="memory-feature">
            <figure className="memory-image memory-image-large">
              <img src="/images/10.jpg" alt="" loading="lazy" />
              <figcaption><span>frame 10</span><b>you make the ordinary glow</b></figcaption>
            </figure>
            <figure className="memory-image memory-image-small">
              <img src="/images/11.jpg" alt="" loading="lazy" />
              <figcaption><span>frame 11</span><b>my safest place</b></figcaption>
            </figure>
          </div>
        </section>

        <section className="gallery-section shell reveal" id="more-of-you">
          <div className="gallery-copy">
            <p className="eyebrow"><span /> a growing little archive</p>
            <h2>More of<br /><em>you, always.</em></h2>
            <p>Some moments deserve their own room. So I left a few more here — floating around, exactly like the way you stay on my mind.</p>
          </div>
          <div className="gallery-ribbon">
            {newImages.slice(2).map(([image, label], index) => (
              <figure className={`gallery-frame gallery-frame-${index + 1}`} key={image}>
                <img src={image} alt="" loading="lazy" />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="promise shell reveal" id="promise">
          <div className="promise-inner">
            <div className="quote-mark">“</div>
            <p className="eyebrow"><span /> okay, one last thing</p>
            <h2>You are my<br /><em>pratidi.</em></h2>
            <p className="promise-copy">Out of every story, every lifetime, every version of us — I would still find my way to you. No special effects needed.</p>
            <button className="outline magnetic" onClick={openLetter}>Tap this, my love <Arrow /></button>
            <em className="signature">forever yours ♡</em>
            {secretFound && <p className="secret-message">you found the secret heart. I knew you would. ♡</p>}
          </div>
          <span className="promise-sticker">you + me<br /><b>always</b></span>
        </section>
      </main>

      <footer className="footer shell"><span>made with too much love</span><b>♥</b><span>for my pratidi</span></footer>

      {letterOpen && <div className="modal-backdrop" onClick={() => setLetterOpen(false)} role="presentation">
        <article className="letter" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="A love letter">
          <button className="close" onClick={() => setLetterOpen(false)} aria-label="Close letter">×</button>
          <p className="eyebrow"><span /> a note for you</p>
          <h2>To my<br /><em>pratidi,</em></h2>
          <p>There are a thousand love stories I could have chosen. But somehow, in every one, I keep looking for you.</p>
          <p>You are the calm in my chaos, the best part of every day, and the person I would choose in every universe.</p>
          <p className="sign-off">Always,<br /><em>me</em> ♥</p>
        </article>
      </div>}
      {burst && <div className="heart-burst" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <span key={index} style={{ '--i': index }}>♥</span>)}</div>}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
