const querystring = require('querystring');
const { Provider } = require('suqin');

const config = {
  baseUrl: 'chinacloudapi.cn',
  name: 'AAD',
};

module.exports = class AzureAD extends Provider {
  /**
   * 构造函数
   * @param {Object} opts 更多配置项
   */
  constructor(opts = { baseUrl: config.baseUrl }) {
    super(opts);

    if (typeof opts.tenlentId !== 'string') throw Error('Params Error: opts.tenlentId must be a String.');
    if (typeof opts.clientId !== 'string') throw Error('Params Error: opts.clientId must be a String.');
    if (typeof opts.userName !== 'string') throw Error('Params Error: opts.userName must be a String.');
    if (typeof opts.userPassword !== 'string') throw Error('Params Error: opts.userPassword must be a String.');

    // 在suqin体系中的代号/名称/key
    this.name = opts.name || config.name;
    // Root Host
    this._baseUrl = opts.baseUrl || config.baseUrl;
    // Auth API Host
    this._authHost = `https://login.${this._baseUrl}`;
    // Graph API Host
    this._graphHost = `https://graph.${this._baseUrl}`;
    // 租户ID
    this._tenlentId = opts.tenlentId;
    // 客户端ID
    this._clientId = opts.clientId;
    // Azure AD 管理员账号
    this._userName = opts.userName;
    // Azure AD 管理员密码
    this._userPassword = opts.userPassword;
    // 缓存token
    this._token = {
      value: null,
      expires: null,
    };
  }

  get token() {
    const token = this._token;
    if (!token.expires || token.expires < +new Date()) {
      return this.getToken();
    }
    return token.value;
  }

  set token(val) {
    this._token = val;
    return this._token;
  }

  /**
   * 获取Token
   */
  async getToken() {
    const authUrl = `${this._authHost}/${this._tenlentId}/oauth2/token?api-version=1.0`;

    return this.fetch({
      method: 'post',
      url: authUrl,
      data: querystring.stringify({
        grant_type: 'password',
        resource: this._graphHost,
        client_id: this._clientId,
        username: this._userName,
        password: this._userPassword,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).then(res => {
      const token = res.data;
      this.token = {
        value: token.access_token,
        // 提前 5 分钟是失效 token
        expires: (token.expires_on - 300) * 1000,
      };
      return token.access_token;
    });
  }

  /**
   * 请求参数构造器
   * 将基础参数进行封装, 用于适配suqin.fetch()
   * @param {Object} opts 基础参数
   */
  async fetchConfGenerator(opts = {}) {
    const token = await this.token;

    return {
      method: opts.method ? opts.method.toLowerCase() : 'get',
      url: `${opts.url}?${querystring.stringify(Object.assign({
        'api-version': '1.5',
      }, opts.query))}`,
      headers: Object.assign({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }, opts.headers),
      data: opts.data,
    };
  }

  /* eslint-disable class-methods-use-this */
  get readAPIs() {
    return {
      /**
       * 查询成员列表
       * @param {Object} opts 其余参数
       */
      async readMembers(opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/users`,
          query: opts,
        }));
      },

      /**
       * 查询成员详情
       * @param {String} principalName 成员主要名字 / 邮箱
       * @param {Object} opts          其余参数
       */
      async readMember(principalName, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/users/${principalName}`,
          query: opts,
        }));
      },


      /**
       * 查询群组列表
       * @param {Object} opts 其余参数
       */
      async readGroups(opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/groups`,
          query: opts,
        }));
      },

      /**
       * 查询群组详情
       * @param {Object} opts 其余参数
       */
      async readGroup(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/groups/${id}`,
          query: opts,
        }));
      },

      /**
       * 查询群组成员
       * @param {String} id 群组id
       */
      async readGroupMembers(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/groups/${id}/$links/members`,
          query: opts,
        }));
      },

      /**
       * 查询指定用户所属部门
       * Get a user's group and directory role memberships
       * @param {String} userId 用户ID
       */
      async readMemberBelong(userId, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._graphHost}/${this._tenlentId}/users/${userId}/$links/memberOf`,
          query: opts,
        }));
      },

      /**
       * 校验用户是否存在
       * @param {String} name 用户主邮箱 principalName
       * @param {String} pwd  用户密码
       * @return {Bolean}     true: 存在, false: 不存在
       */
      async verifiyMember(name, pwd) {
        const authUrl = `${this._authHost}/${this._tenlentId}/oauth2/token?api-version=1.0`;

        return this.fetch({
          method: 'post',
          url: authUrl,
          data: querystring.stringify({
            grant_type: 'password',
            resource: this._graphHost,
            client_id: this._clientId,
            username: name,
            password: pwd,
          }),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
          .then(res => !!res.data.access_token);
      },
    };
  }

  get writeAPIs() {
    return {
      /**
       * 创建成员
       * @param {Object} member 成员
       * @param {Object} opts   其余参数
       */
      async createMember(member, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._graphHost}/${this._tenlentId}/users`,
          query: opts,
          data: member,
        }));
      },

      /**
       * 删除成员
       * @param {String} principalName 成员主要名字 / 邮箱
       * @param {Object} opts          其余参数
       */
      async deleteMember(principalName, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'delete',
          url: `${this._graphHost}/${this._tenlentId}/users/${principalName}`,
          query: opts,
        }));
      },

      /**
       * 修改成员
       * @param {String} principalName 成员主要名字 / 邮箱 / objectId
       * @param {Object} member        成员
       * @param {Object} opts          其余参数
       */
      async updateMember(principalName, member, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'patch',
          url: `${this._graphHost}/${this._tenlentId}/users/${principalName}`,
          query: opts,
          data: member,
        }));
      },

      /**
       * 创建群组
       * @param {Object} group 群组
       * @param {Object} opts  其余参数
       */
      async createGroup(group, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._graphHost}/${this._tenlentId}/groups`,
          query: opts,
          data: group,
        }));
      },

      /**
       * 删除群组
       * @param {String} id   群组ID
       * @param {Object} opts 其余参数
       */
      async deleteGroup(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'delete',
          url: `${this._graphHost}/${this._tenlentId}/groups/${id}`,
          query: opts,
        }));
      },

      /**
       * 修改群组
       * @param {Object} id    群组ID
       * @param {Object} group 群组
       * @param {Object} opts  其余参数
       */
      async updateGroup(id, group, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'patch',
          url: `${this._graphHost}/${this._tenlentId}/groups/${id}`,
          query: opts,
          data: group,
        }));
      },

      /**
       * 添加群组成员
       * @param {String} groupId  群组id
       * @param {String} memberId 成员id
       */
      async addGroupMember(groupId, memberId, opts = {}) {
        const data = { url: `${this._graphHost}/${this._tenlentId}/directoryObjects/${memberId}` };

        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._graphHost}/${this._tenlentId}/groups/${groupId}/$links/members`,
          query: opts,
          data,
        }));
      },

      /**
       * 删除群组成员
       * @param {String} groupId  群组id
       * @param {String} memberId 成员id
       */
      async deleteGroupMember(groupId, memberId, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'delete',
          url: `${this._graphHost}/${this._tenlentId}/groups/${groupId}/$links/members/${memberId}`,
          query: opts,
        }));
      },
    };
  }
  /* eslint-enable class-methods-use-this */
};
