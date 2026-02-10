import throttle from 'lodash.throttle'
import { uuidToId } from 'notion-utils'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 目录导航组件 (少数派风格)
 */
const Catalog = ({ toc, showTOC }) => {
  const tRef = useRef(null)
  const tocIds = []
  const [activeSection, setActiveSection] = useState(null)

  const actionSectionScrollSpy = useCallback(
    throttle(() => {
      const sections = document.getElementsByClassName('notion-h')
      let currentSectionId = activeSection
      for (let i = 0; i < sections.length; ++i) {
        const section = sections[i]
        if (!section || !(section instanceof Element)) continue
        const bbox = section.getBoundingClientRect()
        if (bbox.top - 150 < 0) {
          currentSectionId = section.getAttribute('data-id')
          continue
        }
        break
      }
      setActiveSection(currentSectionId)
    }, 200)
  )

  useEffect(() => {
    window.addEventListener('scroll', actionSectionScrollSpy)
    actionSectionScrollSpy()
    return () => window.removeEventListener('scroll', actionSectionScrollSpy)
  }, [])

  if (!toc || toc.length < 1) return <></>

  return (
    /* 基于屏幕中心线偏移的定位 
      xl:left-[calc(50%+20rem)] 代表屏幕中线往右偏 20rem (约320px)
    */
    <div className={`hidden xl:block fixed top-40 w-64 h-full transition-all duration-500 z-10 
      xl:left-[calc(50%+20rem)]
      ${showTOC ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
      
      <div className='px-4 border-l border-gray-100 dark:border-gray-800 text-left'>
        <div className='text-[10px] uppercase text-gray-400 mb-4 font-bold tracking-widest'>Table of Contents</div>
        <div className='overflow-y-auto max-h-[65vh] scroll-hidden' ref={tRef}>
          <nav className='space-y-3'>
            {toc?.map(tocItem => {
              const id = uuidToId(tocItem.id)
              const isActive = activeSection === id
              return (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`block transition-all duration-300 text-sm hover:text-black dark:hover:text-white
                    ${isActive ? 'text-black dark:text-white font-bold translate-x-1' : 'text-gray-400'}`}
                  style={{ marginLeft: tocItem.indentLevel * 12 }}>
                  <span className="truncate block">{tocItem.text}</span>
                </a>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default Catalog
