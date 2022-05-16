import os
from bridge import Bridge
import datetime as dt
from dotenv import load_dotenv


class Adapter:

    load_dotenv()
    url = os.getenv('NP_API')

    """
    Test using curl -v POST http://192.168.1.162:8080/ -H "Content-Type: application/json" 
    -d '{"id": 0, "data": {"pricearea": "SE3", "return": "Value"}}'
    """

    now = dt.datetime.now()
    end_time = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    to_params = ['pricearea'] # pricearea or time?
    re_params = ['return'] # only value is interesting here, consider hardcoding

    def __init__(self, input):
        self.id = input.get('id', '1')
        self.request_data = input.get('data')
        if self.validate_request_data():
            self.bridge = Bridge()
            self.set_params()
            self.create_request()
        else:
            self.result_error('No data provided')


    def validate_request_data(self):
        if self.request_data is None:
            return False
        if self.request_data == {}:
            return False
        return True


    def set_params(self):
        for param in self.re_params:
            self.re_param = self.request_data.get(param)
            if self.re_param is not None:
                break
        for param in self.to_params:
            self.to_param = self.request_data.get(param)
            if self.to_params is not None:
                break


    def json_parse(self, json_object, path):
        """Basic parser, assumes path is reachable in json_object"""
        for item in path:
            json_object = json_object[item]
        return json_object


    def extract_from_time(self, data, end_time):
        np_rows = self.json_parse(data, ["data", "Rows"])
        for r in np_rows:
            if dt.datetime.fromisoformat(r["EndTime"]) == end_time:
                return r
        return {}


    def extract_from_row(self, data, match="Name", _with='SE3', extract="Value"):
        np_columns = data["Columns"]
        for c in np_columns:
            if (c[match] == _with and c[extract] != " "):
                return c
        return {}


    def parse_nordpool_request(self, data, price_area):
        row = self.extract_from_time(data, end_time=self.end_time)
        return self.extract_from_row(row, _with=price_area)


    def create_request(self):
        try:
            url = self.url
            response = self.bridge.request(url)
            data = self.parse_nordpool_request(response.json(), self.to_param)
            self.result = data[self.re_param]
            self.result_success(data)
        except Exception as e:
            print(response.text)
            self.result_error(e)
        finally:
            self.bridge.close()


    def result_success(self, data):
        self.result = {
            'jobRunID': self.id,
            'data': data,
            'result': self.result,
            'statusCode': 200,
        }


    def result_error(self, error):
        self.result = {
            'jobRunID': self.id,
            'status': 'errored',
            'error': f'There was an error: {error}',
            'statusCode': 500,
        }
