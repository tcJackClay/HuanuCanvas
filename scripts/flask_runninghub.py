#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RunningHub Flask 后端服务
这是 RunningHub API 的 Python/Flask 实现，提供与 Node.js 后端相同的功能。
可独立运行用于测试或作为参考实现。

使用方法:
    python scripts/flask_runninghub.py

启动后服务运行在 http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
import os
import http.client
import mimetypes
from codecs import encode
import json
import time
import requests

app = Flask(__name__)

# 配置常量
THIRD_PARTY_HOST = "www.runninghub.cn"
THIRD_PARTY_PATH = "/task/openapi/upload"
DEFAULT_WEBAPP_ID = "1937084629516193794"
API_HOST = "www.runninghub.cn"
API_KEY = ""


def submit_task(webapp_id, node_info_list):
    """
    提交任务到 RunningHub

    Args:
        webapp_id: RunningHub 应用 ID
        node_info_list: 节点信息列表

    Returns:
        dict: API 响应数据
    """
    conn = http.client.HTTPSConnection(API_HOST)
    payload = json.dumps({
        "webappId": webapp_id,
        "apiKey": API_KEY,
        "nodeInfoList": node_info_list
    })
    headers = {
        'Host': API_HOST,
        'Content-Type': 'application/json'
    }
    conn.request("POST", "/task/openapi/ai-app/run", payload, headers)
    res = conn.getresponse()
    data = json.loads(res.read().decode("utf-8"))
    conn.close()
    return data


def query_task_outputs(task_id):
    """
    查询任务输出结果

    Args:
        task_id: 任务 ID

    Returns:
        dict: API 响应数据
    """
    conn = http.client.HTTPSConnection(API_HOST)
    payload = json.dumps({
        "apiKey": API_KEY,
        "taskId": task_id
    })
    headers = {
        'Host': API_HOST,
        'Content-Type': 'application/json'
    }
    conn.request("POST", "/task/openapi/outputs", payload, headers)
    res = conn.getresponse()
    data = json.loads(res.read().decode("utf-8"))
    conn.close()
    return data


@app.route('/')
def index():
    """返回当前目录下的 index.html"""
    return send_from_directory(os.getcwd(), 'index.html')


@app.route("/health", methods=["GET"])
def health_check():
    """健康检查端点"""
    return jsonify({
        "status": "ok",
        "service": "RunningHub Flask Server",
        "apiKeyConfigured": bool(API_KEY)
    })


@app.route("/get_node_info", methods=["POST"])
def get_node_info():
    """
    获取 RunningHub 应用节点信息

    请求体:
        {
            "webappId": "xxx",
            "apiKey": "xxx"
        }

    响应:
        {
            "success": true,
            "data": { ... }
        }
    """
    global API_KEY
    req = request.get_json()
    webapp_id = req.get("webappId")
    api_key = req.get("apiKey")

    if not api_key or not webapp_id:
        return jsonify({
            "success": False,
            "message": "缺少 webappId 或 apiKey"
        }), 400

    API_KEY = api_key

    try:
        conn = http.client.HTTPSConnection("www.runninghub.cn")
        url = f"/api/webapp/apiCallDemo?apiKey={api_key}&webappId={webapp_id}"
        conn.request("GET", url, headers={})
        res = conn.getresponse()
        data = res.read()
        conn.close()

        try:
            result = json.loads(data.decode("utf-8"))
        except ValueError:
            result = {
                "success": False,
                "message": "第三方返回非 JSON 数据",
                "data": data.decode("utf-8")
            }

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })


@app.route("/upload_file", methods=["POST"])
def upload_file():
    """
    上传文件到 RunningHub

    表单字段:
        - file: 文件
        - fileType: 文件类型 (默认 'input')
        - apiKey: API 密钥

    响应:
        {
            "success": true,
            "thirdPartyResponse": { ... }
        }
    """
    file = request.files.get('file')
    if not file:
        return jsonify({
            "success": False,
            "message": "未收到文件"
        })

    file_type = request.form.get('fileType', 'input')
    api_key = request.form.get('apiKey', API_KEY)

    url = "https://www.runninghub.cn/task/openapi/upload"
    headers = {'Host': 'www.runninghub.cn'}
    data = {'apiKey': api_key, 'fileType': file_type}
    files = {'file': (file.filename, file.stream.read(), file.content_type)}

    response = requests.post(url, headers=headers, files=files, data=data)

    try:
        third_party_data = response.json()
    except ValueError:
        third_party_data = response.text

    return jsonify({
        "success": True,
        "thirdPartyResponse": third_party_data
    })


@app.route("/save_nodes", methods=["POST"])
def save_nodes():
    """
    提交节点并执行任务

    请求体:
        {
            "webappId": "xxx",
            "nodeInfoList2": [...],
            "apiKey": "xxx"
        }

    响应:
        {
            "success": true,
            "fileUrl": "...",
            "taskId": "..."
        }
    """
    global API_KEY
    req = request.get_json()
    node_info_list = req.get("nodeInfoList2")
    webapp_id = req.get("webappId")
    api_key = req.get("apiKey", API_KEY)

    if api_key:
        API_KEY = api_key

    if not node_info_list:
        return jsonify({
            "success": False,
            "message": "nodeInfoList2 为空"
        }), 400

    try:
        submit_result = submit_task(webapp_id, node_info_list)

        if submit_result.get("code") != 0:
            return jsonify({
                "success": False,
                "message": "任务提交失败",
                "data": submit_result
            })

        task_id = submit_result["data"]["taskId"]
        start_time = time.time()
        timeout = 600

        while True:
            outputs_result = query_task_outputs(task_id)
            code = outputs_result.get("code")
            msg = outputs_result.get("msg")
            data = outputs_result.get("data")

            if code == 0 and data:
                return {
                    "success": True,
                    "fileUrl": data,
                    "taskId": task_id,
                    "message": msg or "success"
                }

            elif code == 805:
                failed_reason = data.get("failedReason") if data else None
                if failed_reason:
                    print(f"节点 {failed_reason.get('node_name')} 失败原因: {failed_reason.get('exception_message')}")
                return {
                    "success": False,
                    "message": "任务执行失败",
                    "data": outputs_result
                }

            elif code in (804, 813):
                status_text = "运行中" if code == 804 else "排队中"
                print(f"⏳ 任务{status_text}...")

            else:
                print("⚠️ 未知状态:", outputs_result)

            if time.time() - start_time > timeout:
                return {
                    "success": False,
                    "message": "等待超时（超过10分钟）",
                    "data": outputs_result
                }

            time.sleep(5)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        })


@app.route("/config", methods=["GET"])
def get_config():
    """获取当前配置"""
    return jsonify({
        "apiKey": API_KEY,
        "webappId": DEFAULT_WEBAPP_ID,
        "baseUrl": f"https://{API_HOST}"
    })


@app.route("/config", methods=["POST"])
def update_config():
    """更新配置"""
    global API_KEY
    req = request.get_json()
    API_KEY = req.get("apiKey", API_KEY)
    return jsonify({
        "success": True,
        "message": "配置已更新"
    })


if __name__ == "__main__":
    print("=" * 50)
    print("RunningHub Flask Server 启动")
    print(f"服务地址: http://localhost:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
