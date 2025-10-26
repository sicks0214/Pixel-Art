import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    nav: {
      generator: 'Color Palette Generator', random: 'Random Color', fromImage: 'Color Palette from Image', mixer: 'Color Mixer', contrast: 'Color Contrast Checker', login: 'Login'
    },
    breadcrumb: { generator: 'Color Palette Generator', explore: 'Explore Palettes' },
    page: {
      title: 'AI Color Palette Generator',
      subtitle: 'Enter a name, keyword, or hex to generate a palette.',
      inputPlaceholder: 'TREE / Jungle / #4cae4f',
      generate: 'Generate',
      paletteTitle: '{{name}} Color Palette',
      download: 'Download PNG',
      landscape: 'Landscape',
      square: 'Square',
      css: 'CSS',
      linear: 'Linear Gradient',
      radial: 'Radial Gradient',
      brightness: 'Brightness',
      saturation: 'Saturation',
      warmth: 'Warmth'
    }
  }},
  zh: { translation: {
    nav: { generator: '调色板生成器', random: '随机颜色', fromImage: '图片取色', mixer: '调色实验室', contrast: '对比度检测', login: '登录' },
    breadcrumb: { generator: '调色板生成器', explore: '浏览调色板' },
    page: { title: 'AI 智能调色板生成器', subtitle: '输入名称、关键词或 Hex 生成调色板。', inputPlaceholder: 'TREE / 丛林 / #4cae4f', generate: '生成', paletteTitle: '{{name}} 调色板', download: '下载 PNG', landscape: '横版', square: '方形', css: 'CSS', linear: '线性渐变', radial: '径向渐变', brightness: '亮度', saturation: '饱和度', warmth: '色温' }
  }},
  ja: { translation: {
    nav: { generator: 'カラーパレット生成', random: 'ランダムカラー', fromImage: '画像から抽出', mixer: 'カラーミキサー', contrast: 'コントラストチェッカー', login: 'ログイン' },
    breadcrumb: { generator: 'カラーパレット生成', explore: 'パレットを探索' },
    page: { title: 'AI カラーパレットジェネレーター', subtitle: '名前・キーワード・Hexを入力してください。', inputPlaceholder: 'TREE / ジャングル / #4cae4f', generate: '生成', paletteTitle: '{{name}} カラーパレット', download: 'PNG をダウンロード', landscape: '横長', square: '正方形', css: 'CSS', linear: 'リニアグラデーション', radial: 'ラジアルグラデーション', brightness: '明度', saturation: '彩度', warmth: '色温' }
  }},
  ko: { translation: {
    nav: { generator: '컬러 팔레트 생성기', random: '랜덤 컬러', fromImage: '이미지에서 추출', mixer: '컬러 믹서', contrast: '대비 확인', login: '로그인' },
    breadcrumb: { generator: '컬러 팔레트 생성기', explore: '팔레트 탐색' },
    page: { title: 'AI 컬러 팔레트 생성기', subtitle: '이름, 키워드 또는 Hex를 입력하세요.', inputPlaceholder: 'TREE / 정글 / #4cae4f', generate: '생성', paletteTitle: '{{name}} 컬러 팔레트', download: 'PNG 다운로드', landscape: '가로', square: '정사각형', css: 'CSS', linear: '선형 그라데이션', radial: '방사형 그라데이션', brightness: '명도', saturation: '채도', warmth: '색온' }
  }},
  ru: { translation: {
    nav: { generator: 'Генератор палитр', random: 'Случайный цвет', fromImage: 'Изображение → палитра', mixer: 'Смеситель цветов', contrast: 'Проверка контраста', login: 'Войти' },
    breadcrumb: { generator: 'Генератор палитр', explore: 'Исследовать палитры' },
    page: { title: 'AI генератор цветовых палитр', subtitle: 'Введите название, ключевое слово или Hex.', inputPlaceholder: 'TREE / Jungle / #4cae4f', generate: 'Сгенерировать', paletteTitle: 'Палитра {{name}}', download: 'Скачать PNG', landscape: 'Альбомная', square: 'Квадрат', css: 'CSS', linear: 'Линейный градиент', radial: 'Радиальный градиент', brightness: 'Яркость', saturation: 'Насыщенность', warmth: 'Теплота' }
  }},
  de: { translation: {
    nav: { generator: 'Farbpaletten-Generator', random: 'Zufallsfarbe', fromImage: 'Palette aus Bild', mixer: 'Farbmischer', contrast: 'Kontrast-Check', login: 'Anmelden' },
    breadcrumb: { generator: 'Farbpaletten-Generator', explore: 'Paletten erkunden' },
    page: { title: 'KI-Farbpaletten-Generator', subtitle: 'Name, Stichwort oder Hex eingeben.', inputPlaceholder: 'TREE / Dschungel / #4cae4f', generate: 'Generieren', paletteTitle: '{{name}} Farbpalette', download: 'PNG herunterladen', landscape: 'Querformat', square: 'Quadrat', css: 'CSS', linear: 'Linearer Verlauf', radial: 'Radialer Verlauf', brightness: 'Helligkeit', saturation: 'Sättigung', warmth: 'Wärme' }
  }},
  fr: { translation: {
    nav: { generator: 'Générateur de palettes', random: 'Couleur aléatoire', fromImage: 'Palette depuis image', mixer: 'Mélangeur de couleurs', contrast: 'Vérificateur de contraste', login: 'Connexion' },
    breadcrumb: { generator: 'Générateur de palettes', explore: 'Explorer les palettes' },
    page: { title: 'Générateur de palettes AI', subtitle: 'Saisissez un nom, un mot-clé ou un hex.', inputPlaceholder: 'TREE / Jungle / #4cae4f', generate: 'Générer', paletteTitle: 'Palette {{name}}', download: 'Télécharger PNG', landscape: 'Paysage', square: 'Carré', css: 'CSS', linear: 'Dégradé linéaire', radial: 'Dégradé radial', brightness: 'Luminosité', saturation: 'Saturation', warmth: 'Chaleur' }
  }},
  it: { translation: {
    nav: { generator: 'Generatore palette', random: 'Colore casuale', fromImage: 'Palette da immagine', mixer: 'Mixer colori', contrast: 'Controllo contrasto', login: 'Accedi' },
    breadcrumb: { generator: 'Generatore palette', explore: 'Esplora palette' },
    page: { title: 'Generatore di palette AI', subtitle: 'Inserisci nome, parola chiave o Hex.', inputPlaceholder: 'TREE / Giungla / #4cae4f', generate: 'Genera', paletteTitle: 'Palette {{name}}', download: 'Scarica PNG', landscape: 'Orizzontale', square: 'Quadrato', css: 'CSS', linear: 'Gradiente lineare', radial: 'Gradiente radiale', brightness: 'Luminosità', saturation: 'Saturazione', warmth: 'Calore' }
  }}
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n 