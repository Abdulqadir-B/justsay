import { useEffect } from 'react'

const SITE_URL = 'https://justsay-web.vercel.app'
const SOCIAL_IMAGE = `${SITE_URL}/og-image.svg`

function setMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

function setPropertyMeta(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

export default function PageSeo({ title, description, noindex = false }) {
  useEffect(() => {
    document.title = title
    setMeta('description', description)
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow')

    const pageUrl = `${SITE_URL}${window.location.pathname}`
    setPropertyMeta('og:title', title)
    setPropertyMeta('og:description', description)
    setPropertyMeta('og:url', pageUrl)
    setPropertyMeta('og:image', SOCIAL_IMAGE)
    setPropertyMeta('og:image:alt', `${title} - JustSay`)
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('twitter:image', SOCIAL_IMAGE)
    setMeta('twitter:image:alt', `${title} - JustSay`)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageUrl
  }, [description, noindex, title])

  return null
}
