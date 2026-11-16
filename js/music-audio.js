/* Keep third-party attribution accurate when the shared catalog player changes tracks. */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.music-catalog-table')?.addEventListener('click', event => {
    if (!event.target.closest('.track-row-play-btn')) return;
    const metadata = document.querySelector('.current-track-meta');
    if (metadata) metadata.textContent = 'Kevin MacLeod · Licensed recording · CC BY 4.0';
  });
});
