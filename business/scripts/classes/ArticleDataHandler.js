class ArticleDataHandler {
  constructor(jsonData) {
    this.jsonData = jsonData;
  }

  extractData() {
    const absolutePath = 'https://main--aem-eds--softbankbtob.aem.page';
    return this.jsonData.data.map((item) => {
      const lastModifiedDate = new Date(item.lastModified * 1000);
      const formattedDate = `${lastModifiedDate.getFullYear()}/${String(lastModifiedDate.getMonth() + 1).padStart(2, '0')}/${String(lastModifiedDate.getDate()).padStart(2, '0')}`;

      return {
        title: item['navigation-title'] || item.title,
        path: absolutePath + item.path,
        imagePath: absolutePath + item.image,
        tags: item.tags ? JSON.parse(item.tags).flatMap((tag) => tag.split(',').map((t) => t.replace(/\s+/g, '').trim())) : [],
        lastModified: formattedDate,
      };
    });
  }

  async getGroupedTags() {
    try {
      const response = await fetch('/tag-list.json');
      if (!response.ok) throw new Error('Failed to fetch tag list');
      const tagList = await response.json();

      const articleTags = new Set(this.jsonData.data.flatMap((item) => (item.tags ? JSON.parse(item.tags).flatMap((tag) => tag.split(',').map((t) => t.replace(/\s+/g, '').trim())) : [])));

      const groupOrder = ['業種', 'カテゴリー', 'サービス名', 'キーワード'];

      const groupedTags = tagList.data
        .filter((tagData) => articleTags.has(tagData.tag))
        .reduce((groups, tagData) => {
          if (!groups[tagData.type]) {
            groups[tagData.type] = new Set();
          }
          groups[tagData.type].add(tagData.tag);
          return groups;
        }, {});

      return groupOrder.reduce((ordered, groupName) => {
        if (groupedTags[groupName]) {
          ordered[groupName] = Array.from(groupedTags[groupName]);
        }
        return ordered;
      }, {});
    } catch (error) {
      return {};
    }
  }
}

export default ArticleDataHandler;
