#!/usr/bin/env node

/**
 * 自动生成 sitemap.xml 脚本
 * 用途：根据路由配置自动生成sitemap
 */

const fs = require('fs');
const path = require('path');

// 网站配置
const SITE_URL = 'https://pixelartland.cc';
const OUTPUT_PATH = path.join(__dirname, '../frontend/public/sitemap.xml');

// 页面配置
const pages = [
  {
    url: '/',
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/contact',
    changefreq: 'monthly',
    priority: 0.8,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/terms',
    changefreq: 'yearly',
    priority: 0.5,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/privacy',
    changefreq: 'yearly',
    priority: 0.5,
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/disclaimer',
    changefreq: 'yearly',
    priority: 0.4,
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// 生成sitemap XML
function generateSitemap() {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  const urls = pages.map(page => `  
  <!-- ${page.url === '/' ? 'Homepage' : page.url.substring(1)} -->
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

  const footer = `
  
</urlset>`;

  return header + urls + footer;
}

// 保存sitemap
function saveSitemap() {
  try {
    const sitemap = generateSitemap();
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
    console.log('✅ Sitemap generated successfully!');
    console.log(`📁 Location: ${OUTPUT_PATH}`);
    console.log(`📊 Total URLs: ${pages.length}`);
    console.log('\n📋 Sitemap URLs:');
    pages.forEach(page => {
      console.log(`   - ${SITE_URL}${page.url} (priority: ${page.priority})`);
    });
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// 执行
console.log('🚀 Generating sitemap.xml...\n');
saveSitemap();
console.log('\n✨ Done!');

