// pages/+onBeforeRender.js (или .jsx)
export default function onBeforeRender(pageContext) { // Имя функции и async не критичны
  return {
    pageContext: {
      helmetContext: {}
    }
  };
}