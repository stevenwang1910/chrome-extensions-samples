const defaultApiConfig = {
  name: '',
  url: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  key: '',
  active: false
};

let apiConfigs = [];

document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('addBtn');
  const saveBtn = document.getElementById('saveBtn');
  const apiList = document.getElementById('apiList');
  const message = document.getElementById('message');

  await loadConfigs();
  renderApiList();

  addBtn.addEventListener('click', () => {
    const newConfig = { ...defaultApiConfig, id: Date.now(), name: `API渠道 ${apiConfigs.length + 1}` };
    apiConfigs.push(newConfig);
    renderApiList();
  });

  saveBtn.addEventListener('click', async () => {
    try {
      collectDataFromUI();
      await chrome.storage.local.set({ apiConfigs });
      showMessage('配置已保存', 'success');
    } catch (err) {
      showMessage('保存失败: ' + err.message, 'error');
    }
  });

  async function loadConfigs() {
    const result = await chrome.storage.local.get('apiConfigs');
    apiConfigs = result.apiConfigs || [];
    if (apiConfigs.length === 0) {
      apiConfigs = [{
        id: Date.now(),
        name: 'OpenAI',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        key: '',
        active: true
      }];
    }
  }

  function renderApiList() {
    apiList.innerHTML = '';

    if (apiConfigs.length === 0) {
      apiList.innerHTML = `
        <div class="empty-state">
          <p>暂无配置的API渠道</p>
          <button id="addFirstApiBtn" class="btn btn-primary">添加第一个API</button>
        </div>
      `;
      document.getElementById('addFirstApiBtn').addEventListener('click', () => {
        addBtn.click();
      });
      return;
    }

    apiConfigs.forEach((config, index) => {
      const card = document.createElement('div');
      card.className = 'api-card' + (config.active ? ' active' : '');
      card.dataset.index = index;
      card.innerHTML = `
        <div class="api-card-header">
          <input type="text" class="api-name-input" value="${config.name}" placeholder="API名称" data-field="name">
          <div class="api-actions">
            <label class="active-toggle">
              <input type="checkbox" class="active-checkbox" ${config.active ? 'checked' : ''}>
              <span>启用</span>
            </label>
            <button class="btn btn-danger delete-btn">删除</button>
          </div>
        </div>
        <div class="form-group">
          <label>API URL</label>
          <input type="text" value="${config.url}" placeholder="https://api.openai.com/v1/chat/completions" data-field="url">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>模型名称</label>
            <input type="text" value="${config.model}" placeholder="gpt-3.5-turbo" data-field="model">
          </div>
          <div class="form-group">
            <label>API Key</label>
            <input type="password" value="${config.key}" placeholder="sk-..." data-field="key">
          </div>
        </div>
      `;
      apiList.appendChild(card);

      card.querySelector('.delete-btn').addEventListener('click', () => {
        apiConfigs.splice(index, 1);
        renderApiList();
      });

      card.querySelector('.active-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) {
          apiConfigs.forEach((c, i) => {
            if (i !== index) c.active = false;
          });
        }
        config.active = e.target.checked;
        renderApiList();
      });
    });
  }

  function collectDataFromUI() {
    const cards = document.querySelectorAll('.api-card');
    cards.forEach((card, index) => {
      const inputs = card.querySelectorAll('[data-field]');
      inputs.forEach(input => {
        const field = input.dataset.field;
        apiConfigs[index][field] = input.value;
      });
      apiConfigs[index].active = card.querySelector('.active-checkbox').checked;
    });
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = 'message show ' + type;
    setTimeout(() => {
      message.classList.remove('show');
    }, 3000);
  }
});