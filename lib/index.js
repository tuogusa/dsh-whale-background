// dsh-whale-background — host half.
// 纯浏览器侧效果插件：主机侧无需注册任何服务或提示词，只提供合法的空插件，
// 让 loader 行保持 enabled，从而被 client-modules 的 dsh.client 扫描收录。
const inject = [];

/** @param {import('@deepseek-ai/cordis').Context} ctx */
function apply() {
  // 无主机侧行为。
}

export { apply, inject };
