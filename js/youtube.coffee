$ ->
  $('.youtube').each ->
    width = 560
    height = 420
    $(@).append "<div><iframe width=\"#{width}\" height=\"#{height}\" src=\"http://www.youtube.com/embed/#{@id}\" frameborder=\"0\" allowfullscreen></iframe></div>"
