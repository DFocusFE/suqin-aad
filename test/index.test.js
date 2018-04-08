const { env } = require('process');
const Suqin = require('suqin');
const AzureAD = require('../index');

const { Provider } = Suqin;
const _opts = {
  tenlentId: env.AAD_TENLENT_ID,
  clientId: env.AAD_CLIENT_ID,
  userName: env.AAD_USER_NAME,
  userPassword: env.AAD_USER_PASSWORD,
};

/* global should */

describe('Construct', () => {
  const directories = new Suqin();
  const plugin = new AzureAD(_opts);
  directories.use(plugin);
  it('Plugin is extend by Provider', done => {
    plugin.should.be.an.instanceof(Provider);
    done();
  });
  it('An instance of azureAD has the attributes.', done => {
    plugin.should.have.properties(['name', '_baseUrl', '_authHost', '_graphHost', '_tenlentId', '_clientId', '_userName', '_userPassword', '_token']);
    done();
  });
  // it('Plugin should get a new token when current token was expired', () => {
  //   plugin._token = {
  //     value: '',
  //     expires: 1,
  //   };
  //   console.log(plugin.token)
  //   return plugin.token.should.be.a.String();
  // });
  it('Plugin token can be a string', () => {
    plugin.token = 'abc';
    plugin._token.should.be.an.String();
  });
});

describe('Verifiy', () => {
  it('The tenlentId should be a string', done => {
    (() => new AzureAD(Object.assign({}, _opts, { tenlentId: 123 }))).should.throw(/tenlentId/);
    done();
  });
  it('The clientId should be a string', done => {
    (() => new AzureAD(Object.assign({}, _opts, { clientId: 123 }))).should.throw(/clientId/);
    done();
  });
  it('The userName should be a string', done => {
    (() => new AzureAD(Object.assign({}, _opts, { userName: 123 }))).should.throw(/userName/);
    done();
  });
  it('The userPassword should be a string', done => {
    (() => new AzureAD(Object.assign({}, _opts, { userPassword: 123 }))).should.throw(/userPassword/);
    done();
  });
  it('The instantiation process needs to be reported wrong', done => {
    should(() => new AzureAD()).throw();
    done();
  });
  it('The baseUrl should have a default value', done => {
    const testStr = 'test.string';
    const aad = new AzureAD(Object.assign({}, _opts, { baseUrl: testStr }));
    aad._baseUrl.should.equal(testStr);
    done();
  });
  it('The fetchConfGenerator() should return an Object when no params.', done => {
    const directories = new Suqin();
    const plugin = new AzureAD(_opts);
    directories.use(plugin);
    plugin.fetchConfGenerator().should.be.an.Object();
    done();
  });
});

describe('Exercise', () => {
  const directories = new Suqin();
  const aad = new AzureAD(_opts);
  directories.use(aad);

  const stamp = +new Date();
  const member = {
    accountEnabled: true,
    displayName: `displayMember${stamp}`,
    mailNickname: `mailMember${stamp}`,
    passwordProfile: {
      password: 'Good5432',
      forceChangePasswordNextLogin: false,
    },
    userPrincipalName: `${stamp}@foo.com`,
  };

  const group = {
    displayName: `displayGroup${stamp}`,
    mailNickname: `mailGroup${stamp}`,
    mailEnabled: false,
    securityEnabled: true,
  };

  const changedPwd = {
    passwordProfile: {
      password: 'Test1234',
      forceChangePasswordNextLogin: false,
    },
  };

  const cache = {};

  // About member
  it('Plugin can create a member', () => {
    return directories.createMember(aad.name, member)
      .then(res => {
        res.status.should.equal(201);
        res.data.should.be.an.Object();
        res.data.objectId.should.be.an.String();
        cache.memberId = res.data.objectId;
      });
  });

  it('Plugin can verifiy a member', () => {
    return directories.verifiyMember(aad.name, member.userPrincipalName, member.passwordProfile.password)
      .then(res => {
        res.should.equal(true);
      });
  });

  it('Plugin can update member', () => {
    return directories.updateMember(aad.name, member.userPrincipalName, Object.assign({}, member, { displayName: `CHANGED_${stamp}` }, { passwordProfile: changedPwd.passwordProfile }))
      .then(res => {
        res.status.should.equal(204);
      });
  });

  it('Plugin can read members', () => {
    return directories.readMembers()
      .then(res => {
        res.status.should.equal(200);
        res.data.value.should.be.an.Array();
      });
  });

  it('Plugin can read member', () => {
    return directories.readMember(member.userPrincipalName)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
      });
  });

  // About group
  it('Plugin can create a group', () => {
    return directories.createGroup(aad.name, group)
      .then(res => {
        res.status.should.equal(201);
        res.data.should.be.an.Object();
        res.data.objectId.should.be.an.String();
        cache.groupId = res.data.objectId;
      });
  });

  it('Plugin can update a group', () => {
    return directories.updateGroup(aad.name, cache.groupId, Object.assign({}, group, { displayName: `CHANGED_${stamp}` }))
      .then(res => {
        res.status.should.equal(204);
      });
  });

  it('Plugin can read groups', () => {
    return directories.readGroups()
      .then(res => {
        res.status.should.equal(200);
        res.data.value.should.be.an.Array();
      });
  });

  it('Plugin can read a group', () => {
    return directories.readGroup(cache.groupId)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
      });
  });

  it('Plugin can read members of a group', () => {
    return directories.readGroupMembers(cache.groupId)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.value.should.be.an.Array();
      });
  });

  it('Plugin can read a member\'s belong', () => {
    return directories.readMemberBelong(member.userPrincipalName)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.value.should.be.an.Array();
      });
  });

  it('Plugin can read members of a group', () => {
    return directories.readGroupMembers(cache.groupId)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.value.should.be.an.Array();
      });
  });

  it('Plugin can add a member to a group', () => {
    return directories.addGroupMember(aad.name, cache.groupId, cache.memberId)
      .then(res => {
        res.status.should.equal(204);
        res.data.should.equal('');
      });
  });

  it('Plugin can remove a member from a group', () => {
    return directories.deleteGroupMember(aad.name, cache.groupId, cache.memberId)
      .then(res => {
        res.status.should.equal(204);
        res.data.should.equal('');
      });
  });

  it('Plugin can delete a member', () => {
    return directories.deleteMember(aad.name, member.userPrincipalName)
      .then(res => {
        res.status.should.equal(204);
        res.data.should.equal('');
      });
  });

  it('Plugin can delete a group', () => {
    return directories.deleteGroup(aad.name, cache.groupId)
      .then(res => {
        res.status.should.equal(204);
        res.data.should.equal('');
      });
  });
});
