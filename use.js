
function randomInt (min=0, max=1) {
  return Math.floor(min + Math.random() * (max - min));
}

const urlPrefix = __webpack_public_path__.slice(0, -1) + '/api/v1/task';

export const errors = {
  0: '网络连接错误',
  3302: '未微信授权登录',
  4400: '请求错误',
  4401: '缺少参数',
  4402: '身份不对,非管理员身份登录',
  4403: '没有关注服务号',
  4404: '你被暂时封禁',
  4405: '你被永久封禁',
  4406: '参数错误',
  4407: '发任务频繁,10分钟后发送',
  4408: '任务不符合规范',
  5500: '服务器错误',
  5501: '推送模板消息错误',
};

export const apis = {
  'releaseTask': { // 发布新订单
    url: urlPrefix + '/pub_task',
    method: 'POST',
    chop (p) {
      return {
        'title': p.title,
        'detail': p.description,
        'end_date': p.time,
        'money': p.price,
        'pub_wxid': p.wxid,
      }
    },
    trim (r) {
      return {'tid': r.task_id}
    },
  },

  'pubWxidHistory': { // 获取以前输入的的微信号
    url: urlPrefix + '/get_wxid',
    method: 'GET',
    trim (r) {
      return {'history_wxid': r.pub_wxid}
    }
  },

  'getTaskContent': { // 获取任务信息
    url: urlPrefix + '/detail',
    method: 'GET',
    chop (p) {
      return {'task_id': p.tid}
    },
    trim (r) {
      return {
        "basicInfo": {
          'tid': r.task.task_id,   // 任务id
          'taskId': r.task.task_id,   // 任务id
          'title': r.task.title,   // 标题
          'detail': r.task.detail,  // 详情
          'money': r.task.money,   // 金额
          'deadline': r.task.end_date,  // 截止时间
          'myUsername': '我', //访问者昵称
          'myUid': r.user_id, // 访问者uid
          'pubUsername': r.task.pub_wxid,  // 任务发布者昵称
          'pubWxid': r.task.pub_wxid,  // 任务发布者wxid
          'pubUid': r.task.user_id,   // 任务发布者uid
          'userType': r.identity,   // 用户类型
          'isAdmin': (r.identity == 0),   // 是否为管理员
          'taskStatus': r.task.task_status,   // 任务状态
          'promiseNum': 0,
        },
        "commentData": r.comments.map(i => ({
          'cid': i.comment_id,
          'avatar': i.headimgurl,
          'uid': i.user_id,
          'username': i.nickname,
          'time': i.comment_time,
          'content': i.comment_content,
          'replys': [],
          'annoymous': i.is_annoymous,
        })),
      }
    }
  },

  'helpCountPlus': { // 增加Help次数
    url: urlPrefix + '/help',
    method: 'POST',
    chop (p) {
      return {'task_id': p.tid}
    },
  },

  'postComment': { // 提交评论
    url: urlPrefix + '/comment',
    method: 'POST',
    chop (p) {
      return {
        'task_id': p.tid,
        'comment_content': p.content,
        'is_anonymous': 1,
      }
    },
    trim (r) {
      return {
        'cid': r.comment_id,
        'avatarUrl': r.headimgurl,
        'username': r.nickname || '我',
      }
    },
  },

  'modifyTaskStatus': { // 修改任务状态
    url: urlPrefix + '/set_task_status',
    method: 'POST',
    chop (p) {
      return {
        'task_id': p.tid,
        'task_status': p.status,
      }
    }
  },

  'getReportReasons': { // 获取 举报理由 + 封禁理由
    url: urlPrefix + '',
    method: 'GET',
    handler (resolve, reject, url, params) {
      var rt;
      switch (params.action) {
        case 'forbid-task':
          rt = {
            "reasons": {
              "非法任务": "非法任务",
              "广告/灌水任务": "广告/灌水任务",
              "任务无意义": "任务无意义", 
              "骚扰": "骚扰",
            },
            "punish": {
              1: "不封禁",
              2: "封禁一天",
              3: "永久封禁",
            },
          }
          break;
        case 'forbid-comment':
          rt = {
            "reasons": {
              "评论内容非法": "评论内容非法",
              "广告 / 灌水": "广告 / 灌水",
              "评论偏激": "评论偏激", 
            },
            "punish": {
              1: "不封禁",
              2: "封禁一天",
              3: "永久封禁",
            },
          }
          break;
        case 'report-task':
          rt = {
            "reasons": {
              "非法任务": "非法任务",
              "广告/灌水任务": "广告/灌水任务",
              "任务无意义": "任务无意义", 
              "骚扰": "骚扰",
            },
          }
          break;
        case 'report-comment':
          rt = {
            "reasons": {
              "评论内容非法": "评论内容非法",
              "广告 / 灌水": "广告 / 灌水",
              "评论偏激": "评论偏激", 
            },
          }
          break;
      }
      resolve(rt);
    }
  },

  'getUserForbidStatus': {
    url: urlPrefix + '/user_status',
    method: 'GET',
    chop (p) {
      return {
        'task_id': p.tid,
      }
    },
    trim (r) {
      return {
        'punishCount': r.punishment_times,
      }
    },
  },

  'submitReport': { // 提交举报
    url: urlPrefix + '/report',
    method: 'POST',
    chop (p, resolve, reject) {
      var rt = {};
      if (p.action.indexOf('task') !== -1) { // 举报任务
        rt.type = 1;
        rt.id = p.extra.tid;
        rt.report_reason = p.reportReason;
      } else if (p.action.indexOf('comment') !== -1) { // 举报评论
        rt.type = 2;
        rt.id = p.extra.cid;
        rt.report_reason = p.reportReason;
      } else {
        reject(); return;
      }
      return rt;
    }
  },

  'submitForbid': { // 提交查封
    url: urlPrefix + '/close',
    method: 'POST',
    chop (p, resolve, reject) {
      var rt = {};
      if (p.action.indexOf('task') !== -1) { // 查封任务
        rt.type = 1;
        rt.id = p.extra.tid;
        rt.punish_way = p.forbidPunish;
        rt.punish_reason = p.forbidReason
      } else if (p.action.indexOf('comment') !== -1) { // 查封评论
        rt.type = 2;
        rt.id = p.extra.cid;
        rt.punish_way = p.forbidPunish;
        rt.punish_reason = p.forbidReason
      } else {
        reject(); return;
      }
      return rt;
    },
  },
  // 'submitForbid': { // 提交查封
  //   url: urlPrefix + '/close_task',
  //   method: 'POST',
  //   chop (p, resolve, reject) {
  //     var rt = {};
  //     if (p.action.indexOf('task') !== -1) { // 查封任务
  //       rt.task_id = p.extra.tid;
  //       rt.user_id = p.extra.pubUid + 1;
  //       rt.punish_way = p.forbidPunish;
  //       rt.punish_reason = p.forbidReason
  //     } else if (p.action.indexOf('comment') !== -1) { // 查封评论
  //       reject(); return;
  //     } else {
  //       reject(); return;
  //     }
  //     return rt;
  //   },
  // },

  'checkLogin': {
    url: urlPrefix + '/check_status',
    method: 'GET',
    trim (r) {
      console.log(r);
      return {
        'hasLogin': r.is_log,
        'status': r.status == undefined ? 0 : parseInt(r.status),
        'hasFollow': ('follow' in r) ? (!!r.follow) : true,
      }
    }
  },

  'logout': {
    url: urlPrefix + '/logout',
    method: 'GET',
  },

  'devLogin': { // 开发模式模拟登陆
    url: urlPrefix + '/test',
    method: 'POST',
  },
};