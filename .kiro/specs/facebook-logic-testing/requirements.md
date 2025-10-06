# Requirements Document - Facebook Logic Testing

## Introduction

Dự án Ad Manager Dashboard hiện tại đã có tích hợp Facebook Marketing API với các chức năng như xác thực OAuth, đồng bộ campaigns/ad sets/ads, và quản lý token. Tuy nhiên, cần có một hệ thống testing chi tiết để đảm bảo tất cả các logic Facebook hoạt động đúng trong mọi tình huống, bao gồm các edge cases như token hết hạn, rate limiting, lỗi network, và xử lý pagination.

Mục tiêu là xây dựng một test suite toàn diện để kiểm tra từng bước của Facebook integration, từ token validation, fetching data, sync service, đến error handling và recovery mechanisms.

## Requirements

### Requirement 1: Token Validation Testing

**User Story:** Là một developer, tôi muốn test chi tiết quá trình validate Facebook access token để đảm bảo hệ thống xử lý đúng các trường hợp token hợp lệ, hết hạn, hoặc không hợp lệ.

#### Acceptance Criteria

1. WHEN token hợp lệ được validate THEN hệ thống SHALL trả về `isValid: true` với đầy đủ thông tin app_id, user_id, expires_at, scopes, và business_ids
2. WHEN token hết hạn được validate THEN hệ thống SHALL trả về `isValid: false` với error message rõ ràng
3. WHEN token không hợp lệ được validate THEN hệ thống SHALL trả về `isValid: false` và không throw exception
4. WHEN validate token gặp network timeout THEN hệ thống SHALL retry tối đa 2 lần với exponential backoff
5. WHEN validate token thành công THEN hệ thống SHALL parse granular_scopes để extract business IDs từ ads_management và business_management scopes

### Requirement 2: Ad Accounts Fetching Testing

**User Story:** Là một developer, tôi muốn test chi tiết quá trình fetch ad accounts từ Facebook API để đảm bảo hệ thống lấy đúng tất cả accounts (owned + client) và xử lý đúng các trường hợp lỗi.

#### Acceptance Criteria

1. WHEN fetch business ad accounts THEN hệ thống SHALL gọi cả owned_ad_accounts và client_ad_accounts endpoints
2. WHEN fetch owned accounts thành công THEN hệ thống SHALL map đúng các fields: id, name, account_status, currency, timezone, business_id, access_type='OWNER'
3. WHEN fetch client accounts thành công THEN hệ thống SHALL map đúng với access_type='AGENCY'
4. WHEN client accounts endpoint fail THEN hệ thống SHALL log warning nhưng vẫn trả về owned accounts
5. WHEN có duplicate accounts THEN hệ thống SHALL deduplicate dựa trên account ID
6. WHEN fetch user ad accounts (legacy) THEN hệ thống SHALL sử dụng cache với TTL 30 phút
7. WHEN cache hit THEN hệ thống SHALL không gọi API và trả về cached data

### Requirement 3: Campaigns/AdSets/Ads Fetching with Pagination Testing

**User Story:** Là một developer, tôi muốn test chi tiết quá trình fetch campaigns, ad sets, và ads với pagination để đảm bảo hệ thống lấy đủ tất cả data và không bị loop vô hạn.

#### Acceptance Criteria

1. WHEN fetch campaigns với pagination THEN hệ thống SHALL fetch tất cả pages cho đến khi không còn `paging.next`
2. WHEN pagination loop detected (same URL visited twice) THEN hệ thống SHALL abort và log warning
3. WHEN fetch page thành công THEN hệ thống SHALL accumulate data và log progress
4. WHEN reach max pages limit (100) THEN hệ thống SHALL stop pagination
5. WHEN fetch campaigns THEN hệ thống SHALL sử dụng optimized fields để giảm data transfer
6. WHEN fetch ad sets THEN hệ thống SHALL cache kết quả với TTL 3 phút
7. WHEN fetch ads THEN hệ thống SHALL cache kết quả với TTL 3 phút

### Requirement 4: Insights Fetching Testing

**User Story:** Là một developer, tôi muốn test chi tiết quá trình fetch insights (metrics) cho campaigns, ad sets, và ads để đảm bảo data chính xác và xử lý đúng các trường hợp không có data.

#### Acceptance Criteria

1. WHEN fetch campaign insights với date range THEN hệ thống SHALL format time_range parameter đúng format `{since: 'YYYY-MM-DD', until: 'YYYY-MM-DD'}`
2. WHEN fetch insights với date preset THEN hệ thống SHALL sử dụng date_preset parameter (e.g., 'last_30d')
3. WHEN insights không có data THEN hệ thống SHALL trả về null và cache null result với TTL 2 phút
4. WHEN insights có data THEN hệ thống SHALL parse đúng các metrics: impressions, clicks, spend, reach, frequency, ctr, cpc, cpm
5. WHEN fetch insights thành công THEN hệ thống SHALL cache kết quả với TTL 10 phút
6. WHEN insights endpoint trả về error THEN hệ thống SHALL log warning và trả về null thay vì throw error

### Requirement 5: Rate Limiting and Error Handling Testing

**User Story:** Là một developer, tôi muốn test chi tiết cơ chế rate limiting và error handling để đảm bảo hệ thống không bị Facebook block và xử lý đúng các lỗi.

#### Acceptance Criteria

1. WHEN API call trước khi fetch THEN hệ thống SHALL apply rate limiting với appRateLimiter và adAccountRateLimiter
2. WHEN response header có x-app-usage với call_count >= 95 THEN hệ thống SHALL throttle 2 giây trước khi tiếp tục
3. WHEN gặp rate limit error (code 17, 4, 613, hoặc HTTP 429) THEN hệ thống SHALL retry với exponential backoff + jitter tối đa 4 lần
4. WHEN gặp temporary issue (code 2) THEN hệ thống SHALL retry với backoff 1s * (retry_count + 1)
5. WHEN gặp token expired error (code 190 hoặc HTTP 401) THEN hệ thống SHALL throw FacebookTokenExpiredError
6. WHEN gặp network timeout (30s) THEN hệ thống SHALL abort request và throw network error
7. WHEN retry thành công THEN hệ thống SHALL reset retry count

### Requirement 6: Facebook Sync Service Testing

**User Story:** Là một developer, tôi muốn test chi tiết Facebook Sync Service để đảm bảo quá trình đồng bộ data từ Facebook vào database hoạt động đúng và xử lý errors gracefully.

#### Acceptance Criteria

1. WHEN sync được trigger THEN hệ thống SHALL check lastSyncedAt và skip nếu synced trong 10 phút (trừ khi force=true)
2. WHEN bắt đầu sync THEN hệ thống SHALL update syncStatus='SYNCING' và clear syncError
3. WHEN sync campaigns THEN hệ thống SHALL fetch campaigns, insights, và upsert vào database với đúng mapping
4. WHEN sync ad sets THEN hệ thống SHALL fetch ad sets cho tất cả campaigns và upsert với relationships đúng
5. WHEN sync ads THEN hệ thống SHALL fetch ads cho tất cả ad sets và upsert với relationships đúng
6. WHEN sync thành công THEN hệ thống SHALL update lastSyncedAt, syncStatus='IDLE', và clear syncError
7. WHEN sync gặp error THEN hệ thống SHALL update syncStatus='ERROR', set syncError message, và continue với items khác
8. WHEN sync individual item fail THEN hệ thống SHALL log warning, add to errors array, nhưng continue với items khác
9. WHEN convert budget/spend từ Facebook THEN hệ thống SHALL chia 100 để convert từ cents sang dollars

### Requirement 7: Connection Status Hook Testing

**User Story:** Là một developer, tôi muốn test chi tiết useFacebookConnection hook để đảm bảo UI component nhận đúng connection status và xử lý reconnection flow.

#### Acceptance Criteria

1. WHEN hook được mount với adAccountId THEN hệ thống SHALL gọi check-connection API
2. WHEN connection check thành công THEN hook SHALL trả về connected=true với đầy đủ thông tin adAccountId, facebookAdAccountId, tokenExpiry, scopes
3. WHEN connection check fail THEN hook SHALL trả về connected=false với requiresReconnect, reason, và errorDetails
4. WHEN token sắp hết hạn THEN hook SHALL set tokenExpiryWarning=true
5. WHEN connectFacebook được gọi THEN hệ thống SHALL post đến /api/facebook/connect với accessToken và fbAdAccountId
6. WHEN connect thành công THEN hook SHALL invalidate tất cả related queries và update store state
7. WHEN connect fail THEN hook SHALL trả về error message và set connected=false
8. WHEN query stale time (2 phút) chưa hết THEN hook SHALL sử dụng cached data

### Requirement 8: E2E Facebook Connection Flow Testing

**User Story:** Là một developer, tôi muốn test chi tiết E2E flow của Facebook connection từ UI để đảm bảo user experience mượt mà và xử lý đúng các scenarios.

#### Acceptance Criteria

1. WHEN user chưa connect Facebook THEN UI SHALL hiển thị "Connect Facebook" button
2. WHEN user click "Connect Facebook" THEN hệ thống SHALL mở dialog với "Login with Facebook" button
3. WHEN dialog mở THEN hệ thống SHALL hiển thị message về auto-sync và KHÔNG hiển thị account selection dropdown
4. WHEN token expired THEN UI SHALL hiển thị expired message và "Reconnect Facebook" button
5. WHEN OAuth thành công THEN hệ thống SHALL auto-sync tất cả authorized accounts
6. WHEN có nhiều connect buttons THEN chỉ một dialog instance SHALL được hiển thị
7. WHEN connect thành công THEN dialog SHALL đóng và campaigns SHALL được load

### Requirement 9: Error Recovery and Resilience Testing

**User Story:** Là một developer, tôi muốn test chi tiết khả năng recovery và resilience của hệ thống khi gặp các lỗi Facebook API để đảm bảo hệ thống không crash và có thể tự phục hồi.

#### Acceptance Criteria

1. WHEN gặp FacebookTokenExpiredError trong bất kỳ API call nào THEN error SHALL được propagate lên caller để trigger reconnection flow
2. WHEN gặp network error THEN hệ thống SHALL trả về user-friendly message "Unable to connect to Facebook"
3. WHEN gặp unknown error THEN hệ thống SHALL log error details và trả về generic error message
4. WHEN retry exhausted THEN hệ thống SHALL throw final error với clear message
5. WHEN partial sync success THEN hệ thống SHALL commit successful items và report errors cho failed items
6. WHEN cache corrupted THEN hệ thống SHALL ignore cache và fetch fresh data
7. WHEN concurrent requests THEN rate limiter SHALL coordinate requests để avoid hitting limits

### Requirement 10: Data Integrity and Mapping Testing

**User Story:** Là một developer, tôi muốn test chi tiết data mapping từ Facebook API response sang database models để đảm bảo data integrity và không bị mất thông tin.

#### Acceptance Criteria

1. WHEN map campaign status THEN hệ thống SHALL convert Facebook status (ACTIVE, PAUSED, etc.) sang Prisma enum (ACTIVE, PAUSED, ARCHIVED, DRAFT)
2. WHEN map budget values THEN hệ thống SHALL convert từ cents sang dollars và handle null values
3. WHEN map dates THEN hệ thống SHALL parse date strings sang Date objects và handle invalid dates
4. WHEN map insights metrics THEN hệ thống SHALL parse string numbers sang integers/floats và handle missing fields
5. WHEN upsert campaign THEN hệ thống SHALL preserve existing data không có trong Facebook response
6. WHEN map ad set targeting THEN hệ thống SHALL serialize complex targeting object sang JSON
7. WHEN map creative data THEN hệ thống SHALL extract creative info từ ad object và handle missing creative
