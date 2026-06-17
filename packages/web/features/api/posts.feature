@api @system-a
Feature: Posts API
  As an API consumer
  I want to read and create posts
  So that content can be managed programmatically

  @smoke
  Scenario: Fetch a single post
    When I request post 1
    Then the response status is 200
    And the post has an id of 1

  Scenario: Create a new post
    When I create a post titled "Spectra rocks"
    Then the response status is 201
    And the created post echoes the title "Spectra rocks"
