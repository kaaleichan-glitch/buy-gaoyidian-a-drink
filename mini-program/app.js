// app.js —— 全局入口，只做 Supabase 配置
App({
  globalData: {
    // Supabase 配置（和原版一致）
    supabaseUrl: 'https://vftcjwgoyeqngcshnfyh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdGNqd2dveWVxbmdzY2huZnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDE3NzQsImV4cCI6MjA2NTc3Nzc3NH0.rP0kf8QqIqNkXKf0n5m6rDgFh1mGfIh7Qf8BcJ2Z9L4pE6lD3oR5aYwXsT4uV2wN0bC5dF8gH0jK'
  },
  onLaunch() {
    // 小程序里不需要 DOM ready 检测
  }
});
