module ShopsHelper
  def format_address(address)
    address.to_s.gsub(/^日本、/, '')
  end

  def format_business_hours(hours_string)
    return "" if hours_string.blank?

    # 曜日のリスト
    days = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日", "日曜日"]

    # 曜日ごとの時間帯を格納するハッシュ
    hours_by_day = {}

    # 現在処理中の曜日
    current_day = nil

    # カンマで分割して処理
    hours_string.split(', ').each do |part|
      # 曜日で始まる部分を検出
      day_match = days.find { |day| part.start_with?("#{day}:") }

      if day_match
        # 新しい曜日の開始
        current_day = day_match
        # 時間部分を取得（曜日: の後の部分）
        time_part = part.sub(/^#{current_day}: /, '')
        hours_by_day[current_day] = [time_part]
      else
        # 現在の曜日の追加の時間帯
        hours_by_day[current_day] << part if current_day
      end
    end

    # 整形した結果を作成
    result = []
    days.each do |day|
      if hours_by_day[day]
        result << "<strong>#{day}:</strong> #{hours_by_day[day].join(' / ')}"
      end
    end

    result.join("<br>").html_safe
  end
end