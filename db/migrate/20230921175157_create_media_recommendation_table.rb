class CreateMediaRecommendationTable < ActiveRecord::Migration[7.0]
  def change
    create_table :media_recommendations do |t|
      t.references :recommender, null: false, foreign_key: { to_table: :media_items }
      t.references :recommended, null: false, foreign_key: { to_table: :media_items }
      t.timestamps
    end
  end
end
