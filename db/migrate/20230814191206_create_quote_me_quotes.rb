class CreateQuoteMeQuotes < ActiveRecord::Migration[7.0]
  def change
    create_table :quote_me_quotes do |t|
      t.string :content
      t.string :attribution
      t.string :context

      t.timestamps
    end
  end
end
