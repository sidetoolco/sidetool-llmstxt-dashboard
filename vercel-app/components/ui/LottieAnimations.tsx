'use client'

import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

// Lottie animation URLs from LottieFiles CDN
const animations = {
  crawling: 'https://lottie.host/5c5e5a5a-5e5e-4a5e-8e5e-5a5a5e5e5a5e/crawling.json',
  success: 'https://lottie.host/2c2e2a2a-2e2e-4a2e-8e2e-2a2a2e2e2a2e/success.json',
  empty: 'https://lottie.host/3c3e3a3a-3e3e-4a3e-8e3e-3a3a3e3e3a3e/empty.json',
  error: 'https://lottie.host/4c4e4a4a-4e4e-4a4e-8e4e-4a4a4e4e4a4e/error.json',
  loading: 'https://lottie.host/1c1e1a1a-1e1e-4a1e-8e1e-1a1a1e1e1a1e/loading.json',
}

// For now, we'll use inline JSON animations
const crawlingAnimation = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Crawling",
  ddd: 0,
  assets: [],
  layers: [{
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "Circle",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { 
        a: 1, 
        k: [{
          t: 0,
          s: [0],
          e: [360],
          i: { x: [0.25], y: [1] },
          o: { x: [0.75], y: [0] }
        }, {
          t: 120,
          s: [360]
        }]
      },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { a: 0, k: [100, 100, 100] }
    },
    ao: 0,
    shapes: [{
      ty: "gr",
      it: [{
        ind: 0,
        ty: "sh",
        ks: {
          a: 0,
          k: {
            i: [[0, -20], [20, 0], [0, 20], [-20, 0]],
            o: [[0, 20], [-20, 0], [0, -20], [20, 0]],
            v: [[20, 0], [0, 20], [-20, 0], [0, -20]],
            c: true
          }
        },
        nm: "Path 1"
      }, {
        ty: "st",
        c: { a: 0, k: [1, 0.435, 0.235, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 4 },
        lc: 2,
        lj: 1,
        ml: 10,
        bm: 0,
        nm: "Stroke 1"
      }, {
        ty: "tr",
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
        sk: { a: 0, k: 0 },
        sa: { a: 0, k: 0 },
        nm: "Transform"
      }],
      nm: "Group 1"
    }],
    ip: 0,
    op: 120,
    st: 0,
    bm: 0
  }]
}

const successAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: "Success",
  ddd: 0,
  assets: [],
  layers: [{
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: "Check",
    sr: 1,
    ks: {
      o: { a: 0, k: 100 },
      r: { a: 0, k: 0 },
      p: { a: 0, k: [100, 100, 0] },
      a: { a: 0, k: [0, 0, 0] },
      s: { 
        a: 1,
        k: [{
          t: 0,
          s: [0, 0, 100],
          e: [120, 120, 100],
          i: { x: [0.25], y: [1] },
          o: { x: [0.75], y: [0] }
        }, {
          t: 30,
          s: [120, 120, 100],
          e: [100, 100, 100]
        }, {
          t: 40,
          s: [100, 100, 100]
        }]
      }
    },
    ao: 0,
    shapes: [{
      ty: "gr",
      it: [{
        ind: 0,
        ty: "sh",
        ks: {
          a: 0,
          k: {
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-30, 0], [-10, 20], [30, -20]],
            c: false
          }
        },
        nm: "Path 1"
      }, {
        ty: "st",
        c: { a: 0, k: [0.133, 0.773, 0.369, 1] },
        o: { a: 0, k: 100 },
        w: { a: 0, k: 6 },
        lc: 2,
        lj: 2,
        ml: 10,
        bm: 0,
        nm: "Stroke 1"
      }, {
        ty: "tr",
        p: { a: 0, k: [0, 0] },
        a: { a: 0, k: [0, 0] },
        s: { a: 0, k: [100, 100] },
        r: { a: 0, k: 0 },
        o: { a: 0, k: 100 },
        sk: { a: 0, k: 0 },
        sa: { a: 0, k: 0 },
        nm: "Transform"
      }],
      nm: "Group 1"
    }],
    ip: 0,
    op: 60,
    st: 0,
    bm: 0
  }]
}

const loadingDotsAnimation = {
  v: "5.5.7",
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 50,
  nm: "Loading Dots",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Dot 1",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 25, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { 
          a: 1,
          k: [{
            t: 0,
            s: [100, 100, 100],
            e: [140, 140, 100]
          }, {
            t: 15,
            s: [140, 140, 100],
            e: [100, 100, 100]
          }, {
            t: 30,
            s: [100, 100, 100]
          }]
        }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [{
          d: 1,
          ty: "el",
          s: { a: 0, k: [10, 10] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse Path 1"
        }, {
          ty: "fl",
          c: { a: 0, k: [1, 0.435, 0.235, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
          nm: "Fill 1"
        }],
        nm: "Group 1"
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dot 2",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 25, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { 
          a: 1,
          k: [{
            t: 10,
            s: [100, 100, 100],
            e: [140, 140, 100]
          }, {
            t: 25,
            s: [140, 140, 100],
            e: [100, 100, 100]
          }, {
            t: 40,
            s: [100, 100, 100]
          }]
        }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [{
          d: 1,
          ty: "el",
          s: { a: 0, k: [10, 10] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse Path 1"
        }, {
          ty: "fl",
          c: { a: 0, k: [1, 0.435, 0.235, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
          nm: "Fill 1"
        }],
        nm: "Group 1"
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: "Dot 3",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [140, 25, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { 
          a: 1,
          k: [{
            t: 20,
            s: [100, 100, 100],
            e: [140, 140, 100]
          }, {
            t: 35,
            s: [140, 140, 100],
            e: [100, 100, 100]
          }, {
            t: 50,
            s: [100, 100, 100]
          }]
        }
      },
      ao: 0,
      shapes: [{
        ty: "gr",
        it: [{
          d: 1,
          ty: "el",
          s: { a: 0, k: [10, 10] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse Path 1"
        }, {
          ty: "fl",
          c: { a: 0, k: [1, 0.435, 0.235, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
          nm: "Fill 1"
        }],
        nm: "Group 1"
      }],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
}

export const CrawlingAnimation = ({ size = 200 }: { size?: number }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Lottie animationData={crawlingAnimation} loop={true} />
    </div>
  )
}

export const SuccessAnimation = ({ size = 200 }: { size?: number }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Lottie animationData={successAnimation} loop={false} />
    </div>
  )
}

export const LoadingDotsAnimation = ({ size = 200 }: { size?: number }) => {
  return (
    <div style={{ width: size, height: size/4 }}>
      <Lottie animationData={loadingDotsAnimation} loop={true} />
    </div>
  )
}

export const EmptyStateAnimation = () => {
  return (
    <div className="w-64 h-64 mx-auto opacity-75">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <g className="animate-pulse">
          <rect x="40" y="60" width="120" height="80" rx="8" fill="#F3F4F6" />
          <rect x="50" y="70" width="40" height="4" rx="2" fill="#D1D5DB" />
          <rect x="50" y="80" width="100" height="4" rx="2" fill="#E5E7EB" />
          <rect x="50" y="90" width="80" height="4" rx="2" fill="#E5E7EB" />
          <rect x="50" y="100" width="90" height="4" rx="2" fill="#E5E7EB" />
          <rect x="50" y="110" width="70" height="4" rx="2" fill="#E5E7EB" />
          <rect x="50" y="120" width="85" height="4" rx="2" fill="#E5E7EB" />
          <circle cx="100" cy="40" r="3" fill="#9CA3AF" className="animate-bounce" />
          <circle cx="90" cy="35" r="2" fill="#CBD5E1" className="animate-bounce" style={{ animationDelay: '0.1s' }} />
          <circle cx="110" cy="35" r="2" fill="#CBD5E1" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
        </g>
      </svg>
    </div>
  )
}

export const ErrorAnimation = () => {
  return (
    <div className="w-64 h-64 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <g className="animate-pulse">
          <circle cx="100" cy="100" r="80" fill="#FEE2E2" />
          <path d="M100 50 L100 110" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
          <circle cx="100" cy="130" r="4" fill="#EF4444" />
        </g>
      </svg>
    </div>
  )
}