@web @system-a
Feature: Login
  As a shopper
  I want to sign in to the storefront
  So that I can browse and purchase products

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I log in with valid credentials
    Then I should see the products page

  Scenario: Login is rejected for a locked-out user
    When I log in as "locked_out_user"
    Then I should see an error message containing "locked out"
