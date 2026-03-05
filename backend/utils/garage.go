package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
)

type FetchOptions struct {
	Method  string
	Params  map[string]string
	Body    interface{}
	Headers map[string]string
}

type GarageConfig struct {
	AdminEndpoint string
	S3Endpoint    string
	S3Region      string
	AdminKey      string
}

var Garage = GarageConfig{}

func init() {

	Garage.AdminEndpoint = requiredEnv("API_BASE_URL")
	Garage.S3Endpoint = requiredEnv("S3_ENDPOINT_URL")
	Garage.S3Region = requiredEnv("S3_REGION")
	Garage.AdminKey = requiredEnv("API_ADMIN_KEY")

}

func requiredEnv(name string) string {

	v := os.Getenv(name)

	if len(v) == 0 {

		panic(fmt.Sprintf("Missing %s env variable!", name))
	}

	return v
}

func (g GarageConfig) Fetch(url string, options *FetchOptions) ([]byte, error) {
	var reqBody io.Reader
	reqUrl := fmt.Sprintf("%s%s", g.AdminEndpoint, url)
	method := http.MethodGet

	if len(options.Method) > 0 {
		method = options.Method
	}

	if options.Body != nil {
		body, err := json.Marshal(options.Body)
		if err != nil {
			return nil, err
		}
		reqBody = bytes.NewBuffer(body)
	}

	req, err := http.NewRequest(method, reqUrl, reqBody)
	if err != nil {
		return nil, err
	}

	if options.Params != nil {
		q := req.URL.Query()
		for k, v := range options.Params {
			q.Add(k, v)
		}
		req.URL.RawQuery = q.Encode()
	}

	// Add auth token
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", g.AdminKey))

	if options.Headers != nil {
		for k, v := range options.Headers {
			req.Header.Add(k, v)
		}
	}

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	if res.Body != nil {
		defer res.Body.Close()
	}

	if res.StatusCode != 200 {
		body, err := io.ReadAll(res.Body)
		if err != nil {
			return nil, err
		}

		var data map[string]interface{}

		if err := json.Unmarshal(body, &data); err != nil {
			return nil, err
		}

		message := fmt.Sprintf("unexpected status code: %d", res.StatusCode)
		if data["message"] != nil {
			message = fmt.Sprintf("%v", data["message"])
		}

		return nil, errors.New(message)
	}

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}
