import Comment from '@/components/Comment'
import Live2D from '@/components/Live2D'
import replaceSearchResult from '@/components/Mark'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { deepClone, isBrowser } from '@/lib/utils'
import { Transition } from '@headlessui/react'
import dynamic from 'next/dynamic'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Announcement from './components/Announcement'
import { ArticleFooter } from './components/ArticleFooter'
import { ArticleInfo } from './components/ArticleInfo'
import { ArticleLock } from './components/ArticleLock'
import BlogArchiveItem from './components/BlogArchiveItem'
import BlogListBar from './components/BlogListBar'
import { BlogListPage } from './components/BlogListPage'
import { BlogListScroll } from './components/BlogListScroll'
import Catalog from './components/Catalog'
import { Footer } from './components/Footer'
import JumpToTopButton from './components/JumpToTopButton'
import Nav from './components/Nav'
import SearchNavBar from './components/SearchNavBar'
import CONFIG from './config'
import { Style } from './style'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)

// 主题全局状态
const ThemeGlobalNobelium = createContext()
export const useNobeliumGlobal = () => useContext(ThemeGlobalNobelium)

/**
 * 基础布局
 */
const LayoutBase = props => {
  const { children, post } = props
  const fullWidth = post?.fullWidth ?? false
  const { onLoading } = useGlobal()
  const searchModal = useRef(null)
  const [filterKey, setFilterKey] = useState('')
  const topSlot = <BlogListBar {...props} />

  // --- 少数派风格：滚动显隐目录状态 ---
  const [showTOC, setShowTOC] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      setShowTOC(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <ThemeGlobalNobelium.Provider
      value={{ searchModal, filterKey, setFilterKey }}>
      <div
        id='theme-nobelium'
        className={`${siteConfig('FONT_STYLE')} nobelium relative dark:text-gray-300 w-full bg-white dark:bg-black min-h-screen flex flex-col scroll-smooth`}>
        <Style />

        <Nav {...props} />

        <main
          id='out-wrapper'
          className={`relative m-auto flex-grow w-full transition-all ${!fullWidth ? 'max-w-2xl px-4' : 'px-4 md:px-24'}`}>
          <Transition
            show={!onLoading}
            appear={true}
            enter='transition ease-in-out duration-700 transform order-first'
            enterFrom='opacity-0 translate-y-16'
            enterTo='opacity-100'
            leave='transition ease-in-out duration-300 transform'
            leaveFrom='opacity-100 translate-y-0'
            leaveTo='opacity-0 -translate-y-16'
            unmount={false}>
            {topSlot}
            {children}
            {/* 注入显隐状态 */}
            {post && <Catalog toc={post?.toc} showTOC={showTOC} />}
          </Transition>
        </main>

        <Footer {...props} />

        <div className='fixed right-4 bottom-4'>
          <JumpToTopButton />
        </div>

        <div className='bottom-4 -left-14 fixed justify-end z-40'>
          <Live2D />
        </div>

        <AlgoliaSearchModal cRef={searchModal} {...props} />
      </div>
    </ThemeGlobalNobelium.Provider>
  )
}

const LayoutIndex = props => {
  return <LayoutPostList {...props} topSlot={<Announcement {...props} />} />
}

const LayoutPostList = props => {
  const { posts, topSlot, tag } = props
  const { filterKey } = useNobeliumGlobal()
  let filteredBlogPosts = []
  if (filterKey && posts) {
    filteredBlogPosts = posts.filter(post => {
      const tagContent = post?.tags ? post?.tags.join(' ') : ''
      const searchContent = post.title + post.summary + tagContent
      return searchContent.toLowerCase().includes(filterKey.toLowerCase())
    })
  } else {
    filteredBlogPosts = deepClone(posts)
  }

  return (
    <>
      {topSlot}
      {tag && <SearchNavBar {...props} />}
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogListPage {...props} posts={filteredBlogPosts} />
      ) : (
        <BlogListScroll {...props} posts={filteredBlogPosts} />
      )}
    </>
  )
}

const LayoutSearch = props => {
  const { keyword, posts } = props
  useEffect(() => {
    if (isBrowser) {
      replaceSearchResult({
        doms: document.getElementById('posts-wrapper'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        }
      })
    }
  }, [])

  const { filterKey } = useNobeliumGlobal()
  let filteredBlogPosts = []
  if (filterKey && posts) {
    filteredBlogPosts = posts.filter(post => {
      const tagContent = post?.tags ? post?.tags.join(' ') : ''
      const searchContent = post.title + post.summary + tagContent
      return searchContent.toLowerCase().includes(filterKey.toLowerCase())
    })
  } else {
    filteredBlogPosts = deepClone(posts)
  }

  return (
    <>
      <SearchNavBar {...props} />
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogListPage {...props} posts={filteredBlogPosts} />
      ) : (
        <BlogListScroll {...props} posts={filteredBlogPosts} />
      )}
    </>
  )
}

const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <>
      <div className='mb-10 pb-20 md:py-12 p-3 min-h-screen w-full'>
        {Object.keys(archivePosts).map(archiveTitle => (
          <BlogArchiveItem
            key={archiveTitle}
            archiveTitle={archiveTitle}
            archivePosts={archivePosts}
          />
        ))}
      </div>
    </>
  )
}

const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  useEffect(() => {
    if (!post) {
      setTimeout(() => {
        if (isBrowser) {
          const article = document.querySelector('#article-wrapper #notion-article')
          if (!article) {
            router.push('/404')
          }
        }
      }, waiting404)
    }
  }, [post])
  return (
    <>
      {lock && <ArticleLock validPassword={validPassword} />}
      {!lock && post && (
        <div className='px-2'>
          <ArticleInfo post={post} />
          <div id='article-wrapper'>
            <NotionPage post={post} />
          </div>
          <ShareBar post={post} />
          <Comment frontMatter={post} />
          <ArticleFooter />
        </div>
      )}
    </>
  )
}

const Layout404 = props => {
  const router = useRouter()
  useEffect(() => {
    setTimeout(() => {
      const article = isBrowser && document.getElementById('article-wrapper')
      if (!article) {
        router.push('/')
      }
    }, 3000)
  }, [])

  return <>
        <div className='md:-mt-20 text-black w-full h-screen text-center justify-center content-center items-center flex flex-col'>
            <div className='dark:text-gray-200'>
                <h2 className='inline-block border-r-2 border-gray-600 mr-2 px-3 py-2 align-top'><i className='mr-2 fas fa-spinner animate-spin' />404</h2>
                <div className='inline-block text-left h-32 leading-10 items-center'>
                    <h2 className='m-0 p-0'>页面无法加载，即将返回首页</h2>
                </div>
            </div>
        </div>
    </>
}

const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  return (
    <div id='category-list' className='duration-200 flex flex-wrap'>
      {categoryOptions?.map(category => (
        <SmartLink key={category.name} href={`/category/${category.name}`} passHref legacyBehavior>
          <div className='hover:text-black dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-600 px-5 cursor-pointer py-2 hover:bg-gray-100'>
            <i className='mr-4 fas fa-folder' />
            {category.name}({category.count})
          </div>
        </SmartLink>
      ))}
    </div>
  )
}

const LayoutTagIndex = props => {
  const { tagOptions } = props
  return (
    <div id='tags-list' className='duration-200 flex flex-wrap'>
      {tagOptions.map(tag => (
        <div key={tag.name} className='p-2'>
          <SmartLink href={`/tag/${encodeURIComponent(tag.name)}`} passHref className={`cursor-pointer inline-block rounded hover:bg-gray-500 hover:text-white duration-200 mr-2 py-1 px-2 text-xs whitespace-nowrap dark:hover:text-white text-gray-600 hover:shadow-xl dark:border-gray-400 notion-${tag.color}_background dark:bg-gray-800`}>
            <div className='font-light dark:text-gray-400'>
              <i className='mr-1 fas fa-tag' /> {tag.name + (tag.count ? `(${tag.count})` : '')}
            </div>
          </SmartLink>
        </div>
      ))}
    </div>
  )
}

export {
  Layout404, LayoutArchive, LayoutBase, LayoutCategoryIndex, LayoutIndex, LayoutPostList, LayoutSearch, LayoutSlug, LayoutTagIndex, CONFIG as THEME_CONFIG
}
