require "test_helper"

class Api::V1::TestsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_tests_url
    assert_response :success
  end
end
